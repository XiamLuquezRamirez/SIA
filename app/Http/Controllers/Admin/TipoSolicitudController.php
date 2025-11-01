<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoSolicitud;
use App\Models\Area;
use App\Models\Categoria;
use App\Models\CampoPersonalizado;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TipoSolicitudController extends Controller
{
    /**
     * Mostrar lista de tipos de solicitud
     */
    public function index(Request $request)
    {


        if(!auth()->user()->can('tipos_solicitud.ver')) {
            return redirect()->route('admin.dashboard')->with('error', 'No tienes permisos para ver tipos de solicitud');
        }

        // Debug: Verificar autenticación
        \Log::info('TipoSolicitud index - Auth check', [
            'authenticated' => auth()->check(),
            'user_id' => auth()->id(),
            'is_ajax' => $request->ajax(),
            'session_id' => session()->getId(),
        ]);

        try {
            // Si es petición AJAX, devolver JSON
            if ($request->ajax()) {
                $query = TipoSolicitud::query();

                // Intentar cargar relaciones si existen
                try {
                    $query->with(['area', 'categoria', 'camposPersonalizados']);
                } catch (\Exception $e) {
                    // Si falla la relación, continuar sin ella
                }

                // Búsqueda
                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function($q) use ($search) {
                        $q->where('nombre', 'ILIKE', "%{$search}%")
                          ->orWhere('codigo', 'ILIKE', "%{$search}%");
                    });
                }

                // Filtro por estado
                if ($request->filled('estado')) {
                    if ($request->estado === 'activos') {
                        $query->where('activo', true);
                    } elseif ($request->estado === 'inactivos') {
                        $query->where('activo', false);
                    }
                }

                // Filtro por área (usar area_responsable_id)
                if ($request->filled('area_id') || $request->filled('area_responsable_id')) {
                    $areaId = $request->filled('area_responsable_id') ? $request->area_responsable_id : $request->area_id;
                    $query->where('area_responsable_id', $areaId);
                }

                // Filtro por categoría
                if ($request->filled('categoria')) {
                    $query->where('categoria_id', $request->categoria);
                }

                // Ordenar - usar solo campos que existen con seguridad
                $query->orderBy('id', 'desc');

                // Paginación con per_page configurable
                $perPage = $request->get('per_page', 6);
                $tipos = $query->paginate($perPage);

                return response()->json(
                    [
                        'tipos' => $tipos,
                        'permissions' => [
                            'canCreate' => auth()->user()->can('tipos_solicitud.crear'),
                            'canEdit' => auth()->user()->can('tipos_solicitud.editar'),
                            'canDelete' => auth()->user()->can('tipos_solicitud.eliminar'),
                            'canConfigurarFormulario' => auth()->user()->can('tipos_solicitud.configurar_formulario'),
                            'canClonar' => auth()->user()->can('tipos_solicitud.clonar'),
                            'canActivar' => auth()->user()->can('tipos_solicitud.activar'),
                        ]
                    ]);
            }

            // Vista HTML
            return view('admin.tipos-solicitud.index');
        } catch (\Exception $e) {
            \Log::error('Error en TipoSolicitudController@index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Si es AJAX, devolver error JSON
            if ($request->ajax()) {
                return response()->json([
                    'error' => 'Error al cargar tipos de solicitud',
                    'message' => $e->getMessage()
                ], 500);
            }
            
            // Si es web, redirigir con error
            return redirect()->route('admin.dashboard')
                ->with('error', 'Error al cargar tipos de solicitud: ' . $e->getMessage());
        }
    }

    public function getByCodigo(Request $request, string $codigo)
    {
        $query = TipoSolicitud::where('codigo', $codigo);

        // Si se proporciona un ID a excluir (para modo edición), excluirlo de la búsqueda
        if ($request->has('excluir_id')) {
            $query->where('id', '!=', $request->excluir_id);
        }

        $tipo = $query->first();

        return response()->json([
            'existe' => $tipo ? true : false,
        ]);
    }

    /**
     * Mostrar detalle de un tipo de solicitud
     */
    public function show(string $id)
    {
        $tipo = TipoSolicitud::with([
            'areaResponsable',
            'categoria',
            'creador',
            'editor',
            'camposPersonalizados' => function($query) {
                $query->orderBy('orden');
            },
            'transicionesFlujo' => function($query) {
                $query->with(['estadoOrigen', 'estadoDestino'])
                      ->where('activo', true)
                      ->orderBy('orden');
            }
        ])->findOrFail($id);


        // Agregar tipo_origen y otros atributos del pivot al nivel principal de cada campo
        if ($tipo->camposPersonalizados) {
            $tipo->camposPersonalizados->transform(function ($campo) {
                // Asignar atributos del pivot al nivel principal para facilitar el acceso en el frontend
                $campo->tipo_origen = $campo->pivot->tipo_origen ?? 'personalizado';
                $campo->obligatorio = $campo->pivot->obligatorio ?? false;
                $campo->orden = $campo->pivot->orden ?? 0;

                // Preservar el pivot para referencia
                $campo->pivot_data = [
                    'tipo_origen' => $campo->pivot->tipo_origen ?? 'personalizado',
                    'obligatorio' => $campo->pivot->obligatorio ?? false,
                    'orden' => $campo->pivot->orden ?? 0,
                    'nombre_override' => $campo->pivot->nombre_override,
                    'etiqueta_override' => $campo->pivot->etiqueta_override,
                ];

                return $campo;
            });
        }

        // Construir información del flujo de aprobación
        if ($tipo->transicionesFlujo && $tipo->transicionesFlujo->count() > 0) {
            // Tiene flujo personalizado
            $tipo->flujo_aprobacion = [
                'tipo' => 'personalizado',
                'transiciones' => $tipo->transicionesFlujo->map(function($trans) {
                    return [
                        'id' => $trans->id,
                        'nombre' => $trans->nombre,
                        'descripcion' => $trans->descripcion,
                        'estado_origen' => [
                            'id' => $trans->estadoOrigen->id ?? null,
                            'nombre' => $trans->estadoOrigen->nombre ?? 'Desconocido',
                            'slug' => $trans->estadoOrigen->slug ?? null,
                        ],
                        'estado_destino' => [
                            'id' => $trans->estadoDestino->id ?? null,
                            'nombre' => $trans->estadoDestino->nombre ?? 'Desconocido',
                            'slug' => $trans->estadoDestino->slug ?? null,
                        ],
                        'roles_permitidos' => $trans->roles_permitidos,
                        'requiere_aprobacion' => $trans->requiere_aprobacion_previa ?? false,
                        'requiere_comentario' => $trans->requiere_comentario ?? false,
                        'requiere_documento' => $trans->requiere_documento ?? false,
                        'color_boton' => $trans->color_boton,
                        'texto_boton' => $trans->texto_boton,
                    ];
                })->toArray()
            ];
        } else if (!empty($tipo->flujo_aprobacion) && is_array($tipo->flujo_aprobacion)) {
            // Ya tiene flujo_aprobacion en el campo JSON, mantenerlo
            // (para compatibilidad con datos existentes)
        } else {
            // Usar flujo por defecto
            $tipo->flujo_aprobacion = [
                'tipo' => 'defecto'
            ];
        }

        // Obtener plantillas asociadas
        $plantillas = \DB::table('tipo_solicitud_plantilla')
            ->join('plantillas_documentos', 'tipo_solicitud_plantilla.plantilla_documento_id', '=', 'plantillas_documentos.id')
            ->where('tipo_solicitud_plantilla.tipo_solicitud_id', $id)
            ->select(
                'plantillas_documentos.id',
                'plantillas_documentos.nombre',
                'plantillas_documentos.slug',
                'plantillas_documentos.descripcion',
                'tipo_solicitud_plantilla.generar_automatico',
                'tipo_solicitud_plantilla.momento_generacion',
                'tipo_solicitud_plantilla.es_principal',
                'tipo_solicitud_plantilla.orden'
            )
            ->orderBy('tipo_solicitud_plantilla.orden')
            ->get();
           

        // Verificar permisos de edición de campos
        $puedeEditarCampos = $tipo->puedeEditarCampos();
        $solicitudesCount = $tipo->solicitudes_count;
        $tieneSolicitudes = $tipo->tieneSolicitudesRadicadas();

        // Estadísticas simuladas (implementar cuando exista modelo Solicitud)
        $estadisticas = [
            'radicadas' => $solicitudesCount,
            'en_proceso' => 0,
            'completadas' => 0,
            'este_mes' => 0,
        ];

        return response()->json([
            'tipo' => $tipo,
            'plantillas' => $plantillas,
            'estadisticas' => $estadisticas,
            'permisos' => [
                'puede_editar_campos' => $puedeEditarCampos,
                'tiene_solicitudes' => $tieneSolicitudes,
                'solicitudes_count' => $solicitudesCount,
                'mensaje_bloqueo' => $tieneSolicitudes
                    ? "No se pueden editar los campos porque este tipo de solicitud tiene {$solicitudesCount} solicitud(es) radicada(s). Los cambios en los campos afectarían las solicitudes existentes."
                    : null,
            ],
        ]);
    }

    /**
     * Crear nuevo tipo de solicitud
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:tipos_solicitud,codigo',
            'nombre' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tipos_solicitud,slug|regex:/^[a-z0-9-]+$/',
            'descripcion' => 'nullable|string',
            'instrucciones' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'area_responsable_id' => 'required|exists:areas,id',
            'dias_respuesta' => 'required|integer|min:1',
            'dias_alerta' => 'nullable|integer|min:1',
            'dias_alerta_amarilla' => 'nullable|integer|min:1',
            'dias_alerta_roja' => 'nullable|integer|min:1',
            'tipo_dias' => 'nullable|string|in:habiles,calendario',
            'iniciar_conteo_desde' => 'nullable|string|in:radicacion,asignacion,pago,estado_especifico',
            'sla_dias' => 'nullable|integer|min:1',
            'requiere_aprobacion' => 'boolean',
            'requiere_pago' => 'boolean',
            'valor_tramite' => 'nullable|numeric|min:0',
            'tipo_valor' => 'nullable|string|in:fijo,variable',
            'requiere_documentos' => 'boolean',
            'documentos_requeridos' => 'nullable|array',
            'prioridad_defecto' => 'nullable|string|in:baja,normal,alta,urgente',
            'momento_generacion' => 'nullable|string|in:al_aprobar,al_completar,manual',
            'icono' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'visible_portal' => 'boolean',
            'solo_usuarios_registrados' => 'boolean',
            'activo' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['activo'] = $validated['activo'] ?? false;

        $tipo = TipoSolicitud::create($validated);

        \Log::info('Tipo de solicitud creado', [
            'tipo_id' => $tipo->id,
            'codigo' => $tipo->codigo,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Tipo de solicitud creado exitosamente',
            'tipo' => $tipo->load('area'),
        ], 201);
    }

    /**
     * Actualizar tipo de solicitud
     */
    public function update(Request $request, string $id)
    {
        $tipo = TipoSolicitud::findOrFail($id);

        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:tipos_solicitud,codigo,' . $id,
            'nombre' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tipos_solicitud,slug,' . $id . '|regex:/^[a-z0-9-]+$/',
            'descripcion' => 'nullable|string',
            'instrucciones' => 'nullable|string',
            'categoria_id' => 'required|exists:categorias,id',
            'area_responsable_id' => 'required|exists:areas,id',
            'dias_respuesta' => 'required|integer|min:1',
            'dias_alerta' => 'nullable|integer|min:1',
            'dias_alerta_amarilla' => 'nullable|integer|min:1',
            'dias_alerta_roja' => 'nullable|integer|min:1',
            'tipo_dias' => 'nullable|string|in:habiles,calendario',
            'iniciar_conteo_desde' => 'nullable|string|in:radicacion,asignacion,pago,estado_especifico',
            'sla_dias' => 'nullable|integer|min:1',
            'requiere_aprobacion' => 'boolean',
            'requiere_pago' => 'boolean',
            'valor_tramite' => 'nullable|numeric|min:0',
            'tipo_valor' => 'nullable|string|in:fijo,variable',
            'requiere_documentos' => 'boolean',
            'documentos_requeridos' => 'nullable|array',
            'prioridad_defecto' => 'nullable|string|in:baja,normal,alta,urgente',
            'momento_generacion' => 'nullable|string|in:al_aprobar,al_completar,manual',
            'costo' => 'nullable|numeric|min:0',
            'icono' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'flujo_aprobacion' => 'nullable|array',
        ]);

        $validated['updated_by'] = auth()->id();

        $tipo->update($validated);

        \Log::info('Tipo de solicitud actualizado', [
            'tipo_id' => $tipo->id,
            'updated_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Tipo de solicitud actualizado exitosamente',
            'tipo' => $tipo->load('area'),
        ]);
    }

    /**
     * Eliminar tipo de solicitud
     */
    public function destroy(string $id)
    {
        $tipo = TipoSolicitud::findOrFail($id);

        // Verificar que no tenga solicitudes activas
        // $solicitudesActivas = $tipo->solicitudes()->count();
        // if ($solicitudesActivas > 0) {
        //     return response()->json([
        //         'message' => "No se puede eliminar. Hay {$solicitudesActivas} solicitud(es) asociada(s)"
        //     ], 422);
        // }

        $tipo->delete();

        \Log::info('Tipo de solicitud eliminado', [
            'tipo_id' => $id,
            'deleted_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Tipo de solicitud eliminado exitosamente',
        ]);
    }

    /**
     * Toggle estado activo/inactivo
     */
    public function toggleEstado(Request $request, string $id)
    {
        $tipo = TipoSolicitud::findOrFail($id);
        $nuevoEstado = !$tipo->activo;

        $tipo->activo = $nuevoEstado;
        $tipo->updated_by = auth()->id();
        $tipo->save();

        \Log::info('Estado de tipo de solicitud cambiado', [
            'tipo_id' => $tipo->id,
            'nuevo_estado' => $nuevoEstado ? 'activo' : 'inactivo',
            'changed_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => $nuevoEstado ? 'Tipo de solicitud activado' : 'Tipo de solicitud desactivado',
            'tipo' => $tipo,
        ]);
    }

    /**
     * Obtener categorías disponibles desde la tabla
     */
    public function getCategorias()
    {
        try {
            $categorias = Categoria::activas()
                ->ordenado()
                ->get()
                ->map(function($categoria) {
                    return [
                        'id' => $categoria->id,
                        'nombre' => $categoria->nombre,
                        'slug' => $categoria->slug,
                        'descripcion' => $categoria->descripcion,
                        'color' => $categoria->color,
                        'icono' => $categoria->icono,
                        'nombre_con_icono' => $categoria->nombre_con_icono,
                        'tipos_count' => $categoria->tipos_solicitud_activos_count,
                    ];
                });

            return response()->json([
                'success' => true,
                'categorias' => $categorias
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al cargar categorías', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al cargar categorías',
                'categorias' => []
            ], 500);
        }
    }

    /**
     * Guardar plantillas asociadas al tipo de solicitud
     */
    public function guardarPlantillas(Request $request, string $id)
    {
        \Log::info('Iniciando guardarPlantillas', [
            'tipo_id' => $id,
            'request_data' => $request->all(),
        ]);

        $tipo = TipoSolicitud::findOrFail($id);

        try {
            $validated = $request->validate([
                'plantillas' => 'required|array',
                'plantillas.*.plantilla_documento_id' => 'required|exists:plantillas_documentos,id',
                'plantillas.*.generar_automatico' => 'boolean',
                'plantillas.*.momento_generacion' => 'required|in:al_aprobar,al_completar,manual',
                'plantillas.*.es_principal' => 'boolean',
                'plantillas.*.orden' => 'required|integer|min:1',
            ]);

            \Log::info('Validación exitosa', ['validated' => $validated]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Error de validación en guardarPlantillas', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ]);
            throw $e;
        }

        try {
            \DB::beginTransaction();

            // Eliminar plantillas anteriores del tipo de solicitud
            \DB::table('tipo_solicitud_plantilla')
                ->where('tipo_solicitud_id', $id)
                ->delete();

            // Insertar las nuevas plantillas
            foreach ($validated['plantillas'] as $plantilla) {
                \DB::table('tipo_solicitud_plantilla')->insert([
                    'tipo_solicitud_id' => $id,
                    'plantilla_documento_id' => $plantilla['plantilla_documento_id'],
                    'generar_automatico' => $plantilla['generar_automatico'] ?? true,
                    'momento_generacion' => $plantilla['momento_generacion'],
                    'es_principal' => $plantilla['es_principal'] ?? false,
                    'orden' => $plantilla['orden'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            \DB::commit();

            \Log::info('Plantillas asociadas a tipo de solicitud', [
                'tipo_id' => $id,
                'plantillas_count' => count($validated['plantillas']),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Plantillas guardadas exitosamente',
                'plantillas_count' => count($validated['plantillas']),
            ]);

        } catch (\Exception $e) {
            \DB::rollBack();

            \Log::error('Error al guardar plantillas del tipo de solicitud', [
                'tipo_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar plantillas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Guardar campos rápidos asociados al tipo de solicitud
     */
    public function guardarCamposRapidos(Request $request, string $id)
    {
        \Log::info('Iniciando guardarCamposRapidos', [
            'tipo_id' => $id,
            'request_data' => $request->all(),
        ]);

        $tipo = TipoSolicitud::findOrFail($id);

        try {
            $validated = $request->validate([
                'campos_predefinidos' => 'nullable|array',
                'campos_predefinidos.*' => 'string',
                'campos_personalizados' => 'nullable|array',
                'campos_personalizados.*.id' => 'nullable|integer|exists:campos_personalizados,id',
                'campos_personalizados.*.tipo' => 'required|string',
                'campos_personalizados.*.nombre' => 'nullable|string|max:255',
                'campos_personalizados.*.etiqueta' => 'required|string|max:255',
                'campos_personalizados.*.orden' => 'nullable|integer',
                'campos_personalizados.*.obligatorio' => 'nullable|boolean',
                'campos_personalizados.*.configuracion' => 'nullable|array',
                'campos_biblioteca' => 'nullable|array',
                'campos_biblioteca.*' => 'integer|exists:campos_personalizados,id',
            ]);

            \Log::info('Validación exitosa', ['validated' => $validated]);

            \DB::beginTransaction();

            // Mapeo de campos predefinidos a sus configuraciones
            $camposPredefinidosConfig = [
                'direccion' => [
                    'nombre' => 'Dirección del Predio',
                    'slug' => 'direccion_predio',
                    'tipo' => 'text',
                    'categoria' => 'ubicacion',
                ],
                'barrio' => [
                    'nombre' => 'Barrio/Sector',
                    'slug' => 'barrio_sector',
                    'tipo' => 'text',
                    'categoria' => 'ubicacion',
                ],
                'estrato' => [
                    'nombre' => 'Estrato',
                    'slug' => 'estrato',
                    'tipo' => 'select',
                    'categoria' => 'clasificacion',
                    'opciones' => ['1', '2', '3', '4', '5', '6'],
                ],
                'uso_predio' => [
                    'nombre' => 'Uso del Predio',
                    'slug' => 'uso_predio',
                    'tipo' => 'select',
                    'categoria' => 'clasificacion',
                    'opciones' => ['Residencial', 'Comercial', 'Industrial', 'Mixto'],
                ],
                'area_m2' => [
                    'nombre' => 'Área en m²',
                    'slug' => 'area_m2',
                    'tipo' => 'number',
                    'categoria' => 'medidas',
                ],
                'ubicacion_mapa' => [
                    'nombre' => 'Ubicación en Mapa',
                    'slug' => 'ubicacion_mapa',
                    'tipo' => 'mapa',
                    'categoria' => 'ubicacion',
                ],
                'observaciones' => [
                    'nombre' => 'Observaciones',
                    'slug' => 'observaciones',
                    'tipo' => 'textarea',
                    'categoria' => 'informacion_adicional',
                ],
            ];

            $orden = 1;
            $camposAsociados = [];

            // Procesar campos predefinidos
            if (!empty($validated['campos_predefinidos'])) {
                foreach ($validated['campos_predefinidos'] as $slugPredefinido) {
                    if (!isset($camposPredefinidosConfig[$slugPredefinido])) {
                        continue;
                    }

                    $config = $camposPredefinidosConfig[$slugPredefinido];

                    // Buscar o crear el campo personalizado
                    $campo = CampoPersonalizado::firstOrCreate(
                        ['slug' => $config['slug']],
                        [
                            'nombre' => $config['nombre'],
                            'etiqueta' => $config['nombre'],
                            'variable' => '{{campo.' . $config['slug'] . '}}',
                            'categoria' => $config['categoria'],
                            'tipo' => $config['tipo'],
                            'opciones' => $config['opciones'] ?? null,
                            'activo' => true,
                            'created_by' => auth()->id(),
                        ]
                    );

                    $camposAsociados[] = [
                        'campo_personalizado_id' => $campo->id,
                        'orden' => $orden++,
                        'obligatorio' => false,
                        'tipo_origen' => 'predefinido',
                    ];
                }
            }

            // Procesar campos personalizados del constructor de formularios
            if (!empty($validated['campos_personalizados'])) {
                foreach ($validated['campos_personalizados'] as $campoData) {
                    $etiqueta = $campoData['nombre'] ?? $campoData['etiqueta'];

                    // Extraer configuración del campo
                    $config = $campoData['configuracion'] ?? [];

                    // Preparar opciones para campos select/radio/checkbox
                    $opciones = null;
                    if (isset($config['opciones']) && is_array($config['opciones'])) {
                        $opciones = $config['opciones'];
                    }

                    // Preparar validaciones
                    $validaciones = [];
                    if (isset($config['requerido']) && $config['requerido']) {
                        $validaciones['required'] = true;
                    }
                    if (isset($config['min'])) {
                        $validaciones['min'] = $config['min'];
                    }
                    if (isset($config['max'])) {
                        $validaciones['max'] = $config['max'];
                    }
                    if (isset($config['patron'])) {
                        $validaciones['regex'] = $config['patron'];
                    }

                    // Si el campo tiene ID, es un campo existente que se está reutilizando
                    if (!empty($campoData['id']) && is_numeric($campoData['id'])) {
                        // Usar el campo existente
                        $campoId = $campoData['id'];

                        // Opcionalmente, actualizar el campo existente con nueva configuración
                        $campoExistente = CampoPersonalizado::find($campoId);
                        if ($campoExistente) {
                            $campoExistente->update([
                                'etiqueta' => $etiqueta,
                                'descripcion' => $config['descripcion'] ?? $campoExistente->descripcion,
                                'placeholder' => $config['placeholder'] ?? $campoExistente->placeholder,
                                'opciones' => $opciones ?? $campoExistente->opciones,
                                'valor_defecto' => $config['valorPorDefecto'] ?? $campoExistente->valor_defecto,
                                'validacion' => !empty($validaciones) ? $validaciones : $campoExistente->validacion,
                                'configuracion' => $config,
                                'ancho' => $config['ancho'] ?? $campoExistente->ancho,
                                'updated_by' => auth()->id(),
                            ]);
                        }
                    } else {
                        // Campo nuevo, crear en la biblioteca
                        $slug = CampoPersonalizado::generarSlug($etiqueta);

                        $campo = CampoPersonalizado::create([
                            'nombre' => $etiqueta,
                            'slug' => $slug,
                            'etiqueta' => $etiqueta,
                            'variable' => CampoPersonalizado::generarVariable($slug),
                            'descripcion' => $config['descripcion'] ?? null,
                            'placeholder' => $config['placeholder'] ?? null,
                            'categoria' => 'formulario_tipo_solicitud',
                            'tipo' => $campoData['tipo'],
                            'opciones' => $opciones,
                            'valor_defecto' => $config['valorPorDefecto'] ?? null,
                            'validacion' => !empty($validaciones) ? $validaciones : null,
                            'configuracion' => $config,
                            'ancho' => $config['ancho'] ?? 'completo',
                            'activo' => true,
                            'created_by' => auth()->id(),
                        ]);

                        $campoId = $campo->id;
                    }

                    $camposAsociados[] = [
                        'campo_personalizado_id' => $campoId,
                        'orden' => $campoData['orden'] ?? $orden++,
                        'obligatorio' => $campoData['obligatorio'] ?? ($config['requerido'] ?? false),
                        'tipo_origen' => 'personalizado',
                    ];
                }
            }

            // Procesar campos de biblioteca (ya existentes)
            if (!empty($validated['campos_biblioteca'])) {
                foreach ($validated['campos_biblioteca'] as $campoId) {
                    $camposAsociados[] = [
                        'campo_personalizado_id' => $campoId,
                        'orden' => $orden++,
                        'obligatorio' => false,
                        'tipo_origen' => 'biblioteca',
                    ];
                }
            }

            // Sincronizar campos con el tipo de solicitud usando sync()
            // sync() es inteligente: mantiene existentes, agrega nuevos, elimina los que no están
            if (!empty($camposAsociados)) {
                $syncData = [];
                foreach ($camposAsociados as $asociacion) {
                    $syncData[$asociacion['campo_personalizado_id']] = [
                        'orden' => $asociacion['orden'],
                        'obligatorio' => $asociacion['obligatorio'],
                        'tipo_origen' => $asociacion['tipo_origen'],
                    ];
                }

                // sync() reemplaza todas las asociaciones con las nuevas
                $tipo->camposPersonalizados()->sync($syncData);
            } else {
                // Si no hay campos, eliminar todas las asociaciones
                $tipo->camposPersonalizados()->detach();
            }

            \DB::commit();

            \Log::info('Campos rápidos asociados a tipo de solicitud', [
                'tipo_id' => $id,
                'campos_count' => count($camposAsociados),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campos guardados exitosamente',
                'campos_count' => count($camposAsociados),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \DB::rollBack();

            \Log::error('Error de validación en guardarCamposRapidos', [
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            \DB::rollBack();

            \Log::error('Error al guardar campos del tipo de solicitud', [
                'tipo_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al guardar campos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clonar un tipo de solicitud
     */
    public function clonar(Request $request, string $id)
    {
        \Log::info('Iniciando clonación de tipo de solicitud', [
            'tipo_id_original' => $id,
            'user_id' => auth()->id(),
        ]);

        try {
            \DB::beginTransaction();

            // Cargar el tipo original con todas sus relaciones
            $tipoOriginal = TipoSolicitud::with([
                'camposPersonalizados',
                'transicionesFlujo' => function($query) {
                    $query->with(['estadoOrigen', 'estadoDestino'])
                          ->orderBy('orden');
                }
            ])->findOrFail($id);

            // Generar nuevo código y slug únicos
            $nuevoCodigoBase = $tipoOriginal->codigo . '_COPIA';
            $nuevoNombreBase = $tipoOriginal->nombre . ' (Copia)';
            $nuevoSlugBase = $tipoOriginal->slug . '-copia';

            // Verificar unicidad y ajustar si es necesario
            $contador = 1;
            $nuevoCodigo = $nuevoCodigoBase;
            $nuevoNombre = $nuevoNombreBase;
            $nuevoSlug = $nuevoSlugBase;

            while (TipoSolicitud::where('codigo', $nuevoCodigo)->exists()) {
                $nuevoCodigo = $nuevoCodigoBase . '_' . $contador;
                $nuevoNombre = $nuevoNombreBase . ' ' . $contador;
                $nuevoSlug = $nuevoSlugBase . '-' . $contador;
                $contador++;
            }

            // Crear el nuevo tipo de solicitud
            $nuevoTipo = TipoSolicitud::create([
                'codigo' => $nuevoCodigo,
                'nombre' => $nuevoNombre,
                'slug' => $nuevoSlug,
                'descripcion' => $tipoOriginal->descripcion,
                'instrucciones' => $tipoOriginal->instrucciones,
                'categoria_id' => $tipoOriginal->categoria_id,
                'area_responsable_id' => $tipoOriginal->area_responsable_id,
                'dias_respuesta' => $tipoOriginal->dias_respuesta,
                'dias_alerta' => $tipoOriginal->dias_alerta,
                'dias_alerta_amarilla' => $tipoOriginal->dias_alerta_amarilla,
                'dias_alerta_roja' => $tipoOriginal->dias_alerta_roja,
                'tipo_dias' => $tipoOriginal->tipo_dias ?? 'habiles',
                'iniciar_conteo_desde' => $tipoOriginal->iniciar_conteo_desde ?? 'radicacion',
                'sla_dias' => $tipoOriginal->sla_dias,
                'requiere_aprobacion' => $tipoOriginal->requiere_aprobacion,
                'requiere_pago' => $tipoOriginal->requiere_pago,
                'valor_tramite' => $tipoOriginal->valor_tramite,
                'tipo_valor' => $tipoOriginal->tipo_valor ?? 'fijo',
                'requiere_documentos' => $tipoOriginal->requiere_documentos,
                'documentos_requeridos' => $tipoOriginal->documentos_requeridos,
                'prioridad_defecto' => $tipoOriginal->prioridad_defecto ?? 'normal',
                'icono' => $tipoOriginal->icono,
                'color' => $tipoOriginal->color,
                'visible_portal' => $tipoOriginal->visible_portal ?? true,
                'solo_usuarios_registrados' => $tipoOriginal->solo_usuarios_registrados ?? false,
                'activo' => false, // Crear como inactivo por seguridad
                'created_by' => auth()->id(),
            ]);

            \Log::info('Tipo de solicitud clonado creado', [
                'tipo_original_id' => $id,
                'tipo_nuevo_id' => $nuevoTipo->id,
                'nuevo_codigo' => $nuevoCodigo,
            ]);

            // Clonar campos personalizados
            if ($tipoOriginal->camposPersonalizados && $tipoOriginal->camposPersonalizados->count() > 0) {
                $camposSync = [];
                foreach ($tipoOriginal->camposPersonalizados as $campo) {
                    $camposSync[$campo->id] = [
                        'nombre_override' => $campo->pivot->nombre_override ?? null,
                        'etiqueta_override' => $campo->pivot->etiqueta_override ?? null,
                        'variable_override' => $campo->pivot->variable_override ?? null,
                        'descripcion_override' => $campo->pivot->descripcion_override ?? null,
                        'placeholder_override' => $campo->pivot->placeholder_override ?? null,
                        'valor_defecto_override' => $campo->pivot->valor_defecto_override ?? null,
                        'obligatorio' => $campo->pivot->obligatorio ?? false,
                        'solo_lectura' => $campo->pivot->solo_lectura ?? false,
                        'oculto' => $campo->pivot->oculto ?? false,
                        'ancho' => $campo->pivot->ancho ?? 'completo',
                        'orden' => $campo->pivot->orden ?? 0,
                        'seccion' => $campo->pivot->seccion ?? null,
                        'mostrar_si' => $campo->pivot->mostrar_si ?? null,
                        'tipo_origen' => $campo->pivot->tipo_origen ?? 'personalizado',
                    ];
                }
                $nuevoTipo->camposPersonalizados()->sync($camposSync);

                \Log::info('Campos personalizados clonados', [
                    'tipo_nuevo_id' => $nuevoTipo->id,
                    'campos_count' => count($camposSync),
                ]);
            }

            // Clonar transiciones de flujo personalizado
            if ($tipoOriginal->transicionesFlujo && $tipoOriginal->transicionesFlujo->count() > 0) {
                foreach ($tipoOriginal->transicionesFlujo as $transicion) {
                    \App\Models\TransicionFlujo::create([
                        'tipo_solicitud_id' => $nuevoTipo->id,
                        'estado_origen_id' => $transicion->estado_origen_id,
                        'estado_destino_id' => $transicion->estado_destino_id,
                        'nombre' => $transicion->nombre,
                        'descripcion' => $transicion->descripcion,
                        'roles_permitidos' => $transicion->roles_permitidos,
                        'solo_funcionario_asignado' => $transicion->solo_funcionario_asignado,
                        'requiere_comentario' => $transicion->requiere_comentario,
                        'requiere_documento' => $transicion->requiere_documento,
                        'requiere_aprobacion_previa' => $transicion->requiere_aprobacion_previa,
                        'minimo_dias_transcurridos' => $transicion->minimo_dias_transcurridos,
                        'campos_requeridos' => $transicion->campos_requeridos,
                        'condiciones_personalizadas' => $transicion->condiciones_personalizadas,
                        'reasignar_funcionario' => $transicion->reasignar_funcionario,
                        'usuario_reasignar_id' => $transicion->usuario_reasignar_id,
                        'cambiar_prioridad_a' => $transicion->cambiar_prioridad_a,
                        'recalcular_fecha_vencimiento' => $transicion->recalcular_fecha_vencimiento,
                        'agregar_dias_vencimiento' => $transicion->agregar_dias_vencimiento,
                        'generar_documento' => $transicion->generar_documento,
                        'plantilla_documento_id' => $transicion->plantilla_documento_id,
                        'enviar_notificaciones' => $transicion->enviar_notificaciones,
                        'notificaciones_config' => $transicion->notificaciones_config,
                        'registrar_auditoria' => $transicion->registrar_auditoria,
                        'orden' => $transicion->orden,
                        'color_boton' => $transicion->color_boton,
                        'texto_boton' => $transicion->texto_boton,
                        'requiere_confirmacion' => $transicion->requiere_confirmacion,
                        'mensaje_confirmacion' => $transicion->mensaje_confirmacion,
                        'activo' => $transicion->activo,
                    ]);
                }

                \Log::info('Transiciones de flujo clonadas', [
                    'tipo_nuevo_id' => $nuevoTipo->id,
                    'transiciones_count' => $tipoOriginal->transicionesFlujo->count(),
                ]);
            }

            // Clonar plantillas asociadas
            $plantillasOriginales = \DB::table('tipo_solicitud_plantilla')
                ->where('tipo_solicitud_id', $id)
                ->get();

            if ($plantillasOriginales->count() > 0) {
                foreach ($plantillasOriginales as $plantilla) {
                    \DB::table('tipo_solicitud_plantilla')->insert([
                        'tipo_solicitud_id' => $nuevoTipo->id,
                        'plantilla_documento_id' => $plantilla->plantilla_documento_id,
                        'generar_automatico' => $plantilla->generar_automatico,
                        'momento_generacion' => $plantilla->momento_generacion,
                        'es_principal' => $plantilla->es_principal,
                        'orden' => $plantilla->orden,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                \Log::info('Plantillas clonadas', [
                    'tipo_nuevo_id' => $nuevoTipo->id,
                    'plantillas_count' => $plantillasOriginales->count(),
                ]);
            }

            \DB::commit();

            \Log::info('Clonación completada exitosamente', [
                'tipo_original_id' => $id,
                'tipo_nuevo_id' => $nuevoTipo->id,
                'nuevo_codigo' => $nuevoCodigo,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tipo de solicitud clonado exitosamente',
                'tipo' => $nuevoTipo->load(['area', 'categoria']),
            ], 201);

        } catch (\Exception $e) {
            \DB::rollBack();

            \Log::error('Error al clonar tipo de solicitud', [
                'tipo_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al clonar el tipo de solicitud: ' . $e->getMessage(),
            ], 500);
        }
    }
}
