<x-app-layout>
    <x-slot name="title">Gestión de Usuarios</x-slot>

    <div class="container mx-auto px-4 py-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <p class="text-gray-600 text-sm">Administrar usuarios del sistema</p>
            </div>
            <button onclick="abrirModalCrear()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nuevo Usuario
            </button>
        </div>

        <!-- Main Tabs -->
        <div class="border-b border-gray-200 mb-4">
            <nav class="-mb-px flex space-x-8">
                <button onclick="cambiarVistaUsuariosRoles('usuarios')" id="tabUsuarios" class="main-tab-button active border-b-2 border-blue-600 py-2 px-1 text-sm font-medium text-blue-600">
                    Usuarios
                </button>
                <button onclick="cambiarVistaUsuariosRoles('roles')" id="tabRoles" class="main-tab-button border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Gestión de Roles
                </button>
            </nav>
        </div>

        <!-- Vista de Usuarios -->
        <div id="vistaUsuarios">
            <!-- Sub-tabs para usuarios -->
            <div class="border-b border-gray-200 mb-4">
                <nav class="-mb-px flex space-x-8">
                    <button onclick="filtrarPorTab('todos')" class="tab-button active border-b-2 border-blue-600 py-2 px-1 text-sm font-medium text-blue-600">
                        Todos
                    </button>
                    <button onclick="filtrarPorTab('interno')" class="tab-button border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        Funcionarios
                    </button>
                    <button onclick="filtrarPorTab('externo')" class="tab-button border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        Ciudadanos
                    </button>
                    <button onclick="filtrarPorTab('inactivos')" class="tab-button border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        Inactivos
                    </button>
                </nav>
            </div>

        <!-- Filtros y Búsqueda -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <!-- Búsqueda -->
                <div class="md:col-span-2">
                    <input type="text" id="searchInput" placeholder="Buscar por nombre, email o cédula..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>

                <!-- Filtro Área -->
                <div>
                    <select id="filterArea" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todas las áreas</option>
                    </select>
                </div>

                <!-- Filtro Equipo -->
                <div>
                    <select id="filterEquipo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los equipos</option>
                    </select>
                </div>

                <!-- Filtro Rol -->
                <div>
                    <select id="filterRol" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los roles</option>
                    </select>
                </div>
            </div>

            <!-- Badge de filtros aplicados -->
            <div id="filterBadge" class="mt-2 hidden">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <span id="filterCount">0</span> filtros aplicados
                    <button onclick="limpiarFiltros()" class="ml-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </span>
            </div>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left">
                                <input type="checkbox" id="selectAll" class="rounded border-gray-300">
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área/Equipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
                        <!-- Skeleton Loader -->
                        <tr class="skeleton-row">
                            <td colspan="7" class="px-6 py-4">
                                <div class="animate-pulse flex space-x-4">
                                    <div class="flex-1 space-y-4 py-1">
                                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación -->
            <div class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button id="prevPageMobile" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Anterior
                    </button>
                    <button id="nextPageMobile" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Siguiente
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Mostrando <span id="showingFrom" class="font-medium">0</span> a <span id="showingTo" class="font-medium">0</span> de <span id="totalUsers" class="font-medium">0</span> resultados
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="perPageSelect" class="border border-gray-300 rounded-md text-sm px-2 py-1">
                            <option value="15">15 por página</option>
                            <option value="30">30 por página</option>
                            <option value="50">50 por página</option>
                            <option value="100">100 por página</option>
                        </select>
                        <nav id="pagination" class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <!-- Pagination buttons will be inserted here -->
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Barra flotante de selección múltiple -->
        <div id="bulkActionBar" class="hidden fixed bottom-0 left-0 right-0 bg-blue-600 text-white shadow-lg p-4">
            <div class="container mx-auto flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <span id="selectedCount" class="font-medium">0 usuarios seleccionados</span>
                    <button onclick="limpiarSeleccion()" class="text-white hover:text-blue-200">
                        Limpiar selección
                    </button>
                </div>
                <div class="flex gap-2">
                    <button onclick="exportarMasivo()" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
                        Exportar
                    </button>
                    <button onclick="cambiarEstadoMasivo()" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
                        Cambiar Estado
                    </button>
                    <button onclick="asignarRolMasivo()" class="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
                        Asignar Rol
                    </button>
                </div>
            </div>
        </div>
        </div>
        <!-- Fin Vista de Usuarios -->

        <!-- Vista de Gestión de Roles -->
        <div id="vistaRoles" class="hidden">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">Roles del Sistema</h2>
                    <p class="text-gray-600 text-sm">Gestionar roles y permisos</p>
                </div>
                <button onclick="abrirModalCrearRol()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Nuevo Rol
                </button>
            </div>

            <!-- Filtros -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Búsqueda -->
                    <div>
                        <input type="text" id="searchRoles" placeholder="Buscar roles..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            oninput="filtrarRoles()">
                    </div>

                    <!-- Filtro por Área -->
                    <div>
                        <select id="filterRolArea" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            onchange="filtrarRoles()">
                            <option value="">Todas las áreas</option>
                            <option value="null">Sin área específica</option>
                        </select>
                    </div>

                    <!-- Filtro por Estado -->
                    <div>
                        <select id="filterRolEstado" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            onchange="filtrarRoles()">
                            <option value="">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Grid de Cards de Roles -->
            <div id="rolesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Loading skeleton -->
                <div class="role-card-skeleton bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div class="role-card-skeleton bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div class="role-card-skeleton bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>

            <!-- Mensaje sin resultados -->
            <div id="noRolesMessage" class="hidden bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">No se encontraron roles</h3>
                <p class="text-gray-500">Intenta con otros criterios de búsqueda</p>
            </div>
        </div>
        <!-- Fin Vista de Gestión de Roles -->
    </div>

    <!-- Modal Crear/Editar Usuario -->
    <div id="userModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-4xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="modalTitle" class="text-xl font-semibold text-white">Crear Nuevo Usuario</h3>
                    <button type="button" onclick="cerrarModalConConfirmacion()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="userForm" enctype="multipart/form-data" style="border-radius: 20px;" class="bg-white">
                <!-- Progress Steps -->
                <div class="px-6 pt-6 pb-2">
                    <div class="flex items-start justify-center gap-2 mb-8">
                        <div class="flex items-center flex-1 max-w-xs">
                            <div class="step-indicator active" data-step="1">
                                <div class="step-number">1</div>
                                <div class="step-label">Información Personal</div>
                            </div>
                            <div class="step-line"></div>
                        </div>
                        <div class="flex items-center flex-1 max-w-xs">
                            <div class="step-line"></div>
                            <div class="step-indicator" data-step="2">
                                <div class="step-number">2</div>
                                <div class="step-label">Información Laboral</div>
                            </div>
                            <div class="step-line"></div>
                        </div>
                        <div class="flex items-center flex-1 max-w-xs justify-end">
                            <div class="step-line"></div>
                            <div class="step-indicator" data-step="3">
                                <div class="step-number">3</div>
                                <div class="step-label">Acceso al Sistema</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="px-6 pb-4 max-h-[60vh] overflow-y-auto">
                    <!-- Tab 1: Información Personal -->
                    <div id="tab1" class="tab-content active">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Foto de perfil -->
                            <div class="md:col-span-2 flex justify-center mb-4">
                                <div class="text-center">
                                    <div class="relative inline-block">
                                        <div id="photoPreview" class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                                            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                        <label for="foto" class="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            </svg>
                                        </label>
                                        <input type="file" id="foto" name="foto" accept="image/jpeg,image/png,image/jpg" class="hidden" onchange="manejarSubidaFoto(event)">
                                    </div>
                                    <p class="text-xs text-gray-500 mt-2">Máx. 2MB - JPG, PNG</p>
                                </div>
                            </div>

                            <!-- Tipo de Documento -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Documento <span class="text-red-500">*</span>
                                </label>
                                <select name="tipo_documento" id="tipo_documento" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Seleccione...</option>
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                </select>
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Número de Documento -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Número de Documento <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="cedula" id="cedula" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: 1234567890">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Nombres -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Nombres <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="nombre" id="nombre" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Juan Carlos">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Apellidos -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Apellidos <span class="text-red-500">*</span>
                                </label>
                                <input type="text" name="apellidos" id="apellidos" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Pérez González">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Email -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Correo Electrónico <span class="text-red-500">*</span>
                                </label>
                                <input type="email" name="email" id="email" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="ejemplo@correo.com">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Teléfono -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Teléfono
                                </label>
                                <input type="tel" name="telefono" id="telefono"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: (601) 1234567">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Celular -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Celular
                                </label>
                                <input type="tel" name="celular" id="celular"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: 300 1234567">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Dirección -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección
                                </label>
                                <input type="text" name="direccion" id="direccion"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Calle 123 #45-67">
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Tab 2: Información Laboral -->
                    <div id="tab2" class="tab-content hidden">
                        <div class="grid grid-cols-1 gap-4">
                            <!-- Tipo de Usuario -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-3">
                                    Tipo de Usuario <span class="text-red-500">*</span>
                                </label>
                                <div class="flex gap-6">
                                    <label class="flex items-center cursor-pointer">
                                        <input type="radio" name="tipo_usuario" value="interno" checked
                                            class="w-4 h-4 text-blue-600 focus:ring-blue-500" onchange="alternarTipoUsuario()">
                                        <span class="ml-2 text-gray-700">Funcionario (Interno)</span>
                                    </label>
                                    <label class="flex items-center cursor-pointer">
                                        <input type="radio" name="tipo_usuario" value="externo"
                                            class="w-4 h-4 text-blue-600 focus:ring-blue-500" onchange="alternarTipoUsuario()">
                                        <span class="ml-2 text-gray-700">Ciudadano (Externo)</span>
                                    </label>
                                </div>
                                <span class="error-message text-red-500 text-xs hidden"></span>
                            </div>

                            <!-- Campos de Funcionario -->
                            <div id="funcionarioFields" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Área -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Área <span class="text-red-500">*</span>
                                    </label>
                                    <select name="area_id" id="area_id"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onchange="cargarEquiposPorArea(this.value)">
                                        <option value="">Seleccione un área...</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Equipo -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Equipo <span class="text-red-500">*</span>
                                    </label>
                                    <select name="equipo_id" id="equipo_id"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled>
                                        <option value="">Primero seleccione un área...</option>
                                    </select>
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Cargo -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                        Cargo <span class="text-red-500">*</span>
                                    </label>
                                    <input type="text" name="cargo" id="cargo"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ej: Coordinador de Proyecto">
                                    <span class="error-message text-red-500 text-xs hidden"></span>
                                </div>

                                <!-- Vista Previa de Área/Equipo -->
                                <div id="areaEquipoPreview" class="md:col-span-2 hidden bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 class="font-semibold text-gray-700 mb-2">Información del Equipo</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span class="text-gray-600">Coordinador del Área:</span>
                                            <p id="previewCoordinador" class="font-medium text-gray-800">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-600">Líder del Equipo:</span>
                                            <p id="previewLider" class="font-medium text-gray-800">-</p>
                                        </div>
                                        <div>
                                            <span class="text-gray-600">Miembros del Equipo:</span>
                                            <p id="previewMiembros" class="font-medium text-gray-800">-</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Mensaje para Ciudadanos -->
                            <div id="ciudadanoMessage" class="hidden bg-green-50 border border-green-200 rounded-lg p-4">
                                <div class="flex items-start">
                                    <svg class="w-6 h-6 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div>
                                        <h4 class="font-semibold text-green-800">Usuario Ciudadano</h4>
                                        <p class="text-sm text-green-700 mt-1">
                                            Los usuarios ciudadanos no requieren información laboral.
                                            Continúe al siguiente paso para configurar el acceso al sistema.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab 3: Acceso al Sistema -->
                    <div id="tab3" class="tab-content hidden">
                        <div class="grid grid-cols-1 gap-4">
                            <!-- Roles -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Roles <span class="text-red-500">*</span>
                                </label>
                                <div id="rolesContainer" class="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                                    <p class="text-gray-500 text-sm">Cargando roles...</p>
                                </div>
                                <span class="error-message text-red-500 text-xs hidden"></span>
                                <p class="text-xs text-gray-500 mt-1">Seleccione al menos un rol</p>
                            </div>

                            <!-- Preview de Permisos -->
                            <div id="permisosPreview" class="hidden bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h4 class="font-semibold text-gray-700 mb-2">Permisos del rol seleccionado</h4>
                                <div id="permisosLista" class="text-sm text-gray-600"></div>
                            </div>

                            <!-- Contraseña -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña Temporal <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <input type="password" name="password" id="password" required
                                        class="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Mínimo 8 caracteres"
                                        oninput="verificarFortalezaPassword()">
                                    <button type="button" onclick="alternarVisibilidadPassword('password')"
                                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <span class="error-message text-red-500 text-xs hidden"></span>

                                <!-- Indicador de Fortaleza -->
                                <div class="mt-2">
                                    <div class="flex gap-1">
                                        <div id="strength1" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                        <div id="strength2" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                        <div id="strength3" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                        <div id="strength4" class="h-1 flex-1 bg-gray-200 rounded"></div>
                                    </div>
                                    <p id="strengthLabel" class="text-xs text-gray-500 mt-1">Fortaleza de contraseña</p>
                                </div>
                            </div>

                            <!-- Confirmar Contraseña -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmar Contraseña <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <input type="password" name="password_confirmation" id="password_confirmation" required
                                        class="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Repita la contraseña"
                                        oninput="verificarCoincidenciaPassword()">
                                    <button type="button" onclick="alternarVisibilidadPassword('password_confirmation')"
                                        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <span class="error-message text-red-500 text-xs hidden"></span>
                                <p id="passwordMatchMessage" class="text-xs mt-1 hidden"></p>
                            </div>

                            <!-- Opciones adicionales -->
                            <div class="space-y-3 pt-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" name="enviar_email" id="enviar_email" checked
                                        class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                                    <span class="ml-2 text-sm text-gray-700">Enviar email de bienvenida con credenciales</span>
                                </label>

                                <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <span class="text-sm font-medium text-gray-700">Usuario Activo</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="activo" id="activo" checked class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                    <button type="button" id="prevButton" onclick="anteriorTab()"
                        class="hidden px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Anterior
                    </button>
                    <div class="flex-1"></div>
                    <div class="flex gap-2">
                        <button type="button" onclick="cerrarModalConConfirmacion()"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancelar
                        </button>
                        <button type="button" id="nextButton" onclick="siguienteTab()"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Siguiente
                        </button>
                        <button type="submit" id="submitButton"
                            class="hidden px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            Guardar Usuario
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Activar/Desactivar -->
    <div id="toggleStatusModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-0 border w-11/12 max-w-lg shadow-lg bg-white" style="border-radius: 30px;">
            <!-- Modal Header -->
            <div id="toggleModalHeader" class="px-6 py-4 border-b border-gray-200" style="border-top-left-radius: 30px; border-top-right-radius: 30px;">
                <h3 id="toggleModalTitle" class="text-xl font-semibold text-gray-900"></h3>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-4">
                <!-- User Info -->
                <div class="flex items-center mb-4 pb-4 border-b border-gray-200">
                    <div id="toggleUserPhoto" class="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        <!-- Photo will be inserted here -->
                    </div>
                    <div class="ml-4 flex-1">
                        <h4 id="toggleUserName" class="text-lg font-semibold text-gray-900"></h4>
                        <p id="toggleUserEmail" class="text-sm text-gray-600"></p>
                        <div id="toggleUserType" class="mt-1"></div>
                    </div>
                </div>

                <!-- User Details -->
                <div id="toggleUserDetails" class="mb-4 space-y-2 text-sm">
                    <!-- Details will be inserted here -->
                </div>

                <!-- Warning/Info Box -->
                <div id="toggleWarningBox" class="mb-4">
                    <!-- Warning will be inserted here -->
                </div>

                <!-- Reasignación de tareas (solo para desactivar) -->
                <div id="reasignarTareasSection" class="hidden mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Reasignar tareas a:
                    </label>
                    <select id="reasignarTareasSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccione una opción...</option>
                        <option value="lider">Líder del equipo</option>
                        <option value="otro">Otro usuario...</option>
                        <option value="null">Dejar sin asignar</option>
                    </select>

                    <div id="selectOtroUsuario" class="hidden mt-2">
                        <select id="otroUsuarioSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccione un usuario...</option>
                        </select>
                    </div>
                </div>

                <!-- Motivo -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Motivo <span id="motivoOptional" class="text-gray-500">(opcional)</span>
                    </label>
                    <textarea id="toggleMotivo" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Fin de contrato, licencia temporal, etc."></textarea>
                </div>

                <!-- Notificar -->
                <div class="mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="toggleNotificar" class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                        <span class="ml-2 text-sm text-gray-700">Notificar al usuario por email</span>
                    </label>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                <button type="button" onclick="cerrarModalAlternar()"
                    class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cancelar
                </button>
                <button type="button" id="confirmToggleButton" onclick="confirmarAlternarEstado()"
                    class="px-4 py-2 text-white rounded-lg transition">
                    <!-- Text will be set dynamically -->
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Ver Detalle de Usuario -->
    <div id="viewUserModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-6xl shadow-lg bg-white" style="border-radius: 30px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700" style="border-top-left-radius: 30px; border-top-right-radius: 30px;">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">Perfil de Usuario</h3>
                    <div class="flex gap-2">
                        <button type="button" onclick="imprimirPerfilUsuario()" class="text-white hover:text-gray-200 transition px-3 py-1 rounded-lg hover:bg-blue-800" title="Imprimir Perfil">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                            </svg>
                        </button>
                        <button type="button" onclick="cerrarModalVerUsuario()" class="text-white hover:text-gray-200 transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal Body -->
            <div class="bg-white">
                <!-- Tabs -->
                <div class="border-b border-gray-200 px-6">
                    <nav class="-mb-px flex space-x-8">
                        <button onclick="cambiarTabVista('personal')" class="view-tab-button active border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600">
                            Información Personal
                        </button>
                        <button onclick="cambiarTabVista('laboral')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Información Laboral
                        </button>
                        <button onclick="cambiarTabVista('roles')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Roles y Permisos
                        </button>
                        <button onclick="cambiarTabVista('actividad')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Historial de Actividad
                        </button>
                        <button onclick="cambiarTabVista('estadisticas')" class="view-tab-button border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Estadísticas
                        </button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div class="px-6 py-6 max-h-[65vh] overflow-y-auto">
                    <!-- Tab: Información Personal -->
                    <div id="viewTabPersonal" class="view-tab-content">
                        <div class="flex flex-col md:flex-row gap-6">
                            <!-- Foto y datos básicos -->
                            <div class="md:w-1/3">
                                <div class="text-center">
                                    <div id="viewUserPhoto" class="w-40 h-40 mx-auto rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-blue-100">
                                        <!-- Photo will be inserted here -->
                                    </div>
                                    <h4 id="viewUserName" class="mt-4 text-xl font-bold text-gray-900"></h4>
                                    <p id="viewUserEmail" class="text-gray-600"></p>
                                    <div id="viewUserStatus" class="mt-2">
                                        <!-- Status badge will be inserted here -->
                                    </div>
                                </div>
                                <div class="mt-6 flex gap-2">
                                    <button onclick="editarUsuarioDesdeVista()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                        </svg>
                                        Editar
                                    </button>
                                    <button onclick="enviarEmailAUsuario()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                        </svg>
                                        Email
                                    </button>
                                </div>
                            </div>

                            <!-- Información detallada -->
                            <div class="md:w-2/3">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Tipo de Documento</label>
                                        <p id="viewUserTipoDoc" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Número de Documento</label>
                                        <p id="viewUserCedula" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Email</label>
                                        <p id="viewUserEmailDetalle" class="text-gray-900 font-medium mt-1">
                                            <a href="#" onclick="return false;" class="text-blue-600 hover:underline"></a>
                                        </p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Teléfono</label>
                                        <p id="viewUserTelefono" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Celular</label>
                                        <p id="viewUserCelular" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Dirección</label>
                                        <p id="viewUserDireccion" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Fecha de Registro</label>
                                        <p id="viewUserFechaRegistro" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <label class="text-xs text-gray-500 font-semibold uppercase">Último Acceso</label>
                                        <p id="viewUserUltimoAcceso" class="text-gray-900 font-medium mt-1"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Información Laboral -->
                    <div id="viewTabLaboral" class="view-tab-content hidden">
                        <div id="viewLaboralFuncionario" class="hidden">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                    <h5 class="font-semibold text-gray-900 mb-2">Área</h5>
                                    <p id="viewLaboralArea" class="text-gray-800 text-lg font-medium"></p>
                                    <p class="text-sm text-gray-600 mt-1">Coordinador: <span id="viewLaboralCoordinador"></span></p>
                                </div>
                                <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                    <h5 class="font-semibold text-gray-900 mb-2">Equipo</h5>
                                    <p id="viewLaboralEquipo" class="text-gray-800 text-lg font-medium"></p>
                                    <p class="text-sm text-gray-600 mt-1">Líder: <span id="viewLaboralLider"></span></p>
                                </div>
                                <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                                    <h5 class="font-semibold text-gray-900 mb-2">Cargo</h5>
                                    <p id="viewLaboralCargo" class="text-gray-800 text-lg font-medium"></p>
                                </div>
                                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                                    <h5 class="font-semibold text-gray-900 mb-2">Antigüedad</h5>
                                    <p id="viewLaboralFechaIngreso" class="text-gray-700 text-sm"></p>
                                    <p id="viewLaboralTiempo" class="text-gray-800 text-lg font-medium mt-1"></p>
                                </div>
                            </div>
                        </div>
                        <div id="viewLaboralCiudadano" class="hidden">
                            <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded">
                                <div class="flex items-start">
                                    <svg class="w-8 h-8 text-green-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    <div>
                                        <h4 class="font-semibold text-green-800 text-lg">Usuario Externo</h4>
                                        <p class="text-gray-700 mt-2">
                                            Este usuario es un ciudadano externo a la organización.
                                        </p>
                                        <p class="text-gray-600 text-sm mt-2">
                                            Solicitudes realizadas: <span id="viewLaboralSolicitudes" class="font-semibold text-gray-800">0</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Roles y Permisos -->
                    <div id="viewTabRoles" class="view-tab-content hidden">
                        <!-- Roles asignados -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-semibold text-gray-900">Roles Asignados</h4>
                                <button onclick="gestionarRolesUsuario()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
                                    Gestionar Roles
                                </button>
                            </div>
                            <div id="viewRolesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Roles will be inserted here -->
                            </div>
                        </div>

                        <!-- Permisos efectivos -->
                        <div>
                            <h4 class="text-lg font-semibold text-gray-900 mb-4">Permisos Efectivos</h4>
                            <div id="viewPermisosList" class="space-y-4">
                                <!-- Permisos will be inserted here -->
                            </div>
                        </div>
                    </div>

                    <!-- Tab: Historial de Actividad -->
                    <div id="viewTabActividad" class="view-tab-content hidden">
                        <div class="mb-4">
                            <h4 class="text-lg font-semibold text-gray-900">Últimas 20 Actividades</h4>
                            <p class="text-sm text-gray-600">Registro de acciones realizadas por el usuario</p>
                        </div>
                        <div id="viewActividadList" class="relative">
                            <!-- Timeline will be inserted here -->
                        </div>
                        <div class="mt-4 text-center">
                            <button onclick="verActividadCompleta()" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                Ver Historial Completo →
                            </button>
                        </div>
                    </div>

                    <!-- Tab: Estadísticas -->
                    <div id="viewTabEstadisticas" class="view-tab-content hidden">
                        <!-- Cards de métricas -->
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <p class="text-sm text-gray-600 font-semibold uppercase">Tareas Mes</p>
                                <p id="viewStatTareasMes" class="text-3xl font-bold text-blue-600 mt-1">0</p>
                            </div>
                            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <p class="text-sm text-gray-600 font-semibold uppercase">Tareas Total</p>
                                <p id="viewStatTareasTotal" class="text-3xl font-bold text-green-600 mt-1">0</p>
                            </div>
                            <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                                <p class="text-sm text-gray-600 font-semibold uppercase">Documentos</p>
                                <p id="viewStatDocumentos" class="text-3xl font-bold text-purple-600 mt-1">0</p>
                            </div>
                            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                                <p class="text-sm text-gray-600 font-semibold uppercase">Último Acceso</p>
                                <p id="viewStatUltimoAcceso" class="text-3xl font-bold text-yellow-600 mt-1">0</p>
                                <p class="text-xs text-gray-500">días</p>
                            </div>
                        </div>

                        <!-- Gráficos (placeholder) -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white border border-gray-200 rounded-lg p-4">
                                <h5 class="font-semibold text-gray-900 mb-2">Actividad por Día (Últimos 30 días)</h5>
                                <div class="h-48 flex items-center justify-center bg-gray-50 rounded">
                                    <p class="text-gray-500 text-sm">Gráfico próximamente</p>
                                </div>
                            </div>
                            <div class="bg-white border border-gray-200 rounded-lg p-4">
                                <h5 class="font-semibold text-gray-900 mb-2">Distribución de Tareas</h5>
                                <div class="h-48 flex items-center justify-center bg-gray-50 rounded">
                                    <p class="text-gray-500 text-sm">Gráfico próximamente</p>
                                </div>
                            </div>
                        </div>

                        <!-- Estadísticas de líder/coordinador -->
                        <div id="viewStatLiderazgo" class="hidden mt-6">
                            <h5 class="font-semibold text-gray-900 mb-4">Estadísticas de Liderazgo</h5>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p class="text-sm text-gray-600">Próximamente: Estadísticas del equipo/área</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2" style="border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;">
                <button type="button" onclick="cerrarModalVerUsuario()" class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cerrar
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Restablecer Contraseña -->
    <div id="resetPasswordModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-0 border w-11/12 max-w-lg shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-orange-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">Restablecer Contraseña</h3>
                    <button type="button" onclick="cerrarModalRestablecerPassword()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-4">
                <!-- User Info -->
                <div class="flex items-center mb-4 pb-4 border-b border-gray-200">
                    <div id="resetUserPhoto" class="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="ml-4 flex-1">
                        <h4 id="resetUserName" class="text-lg font-semibold text-gray-900"></h4>
                        <p id="resetUserEmail" class="text-sm text-gray-600"></p>
                    </div>
                </div>

                <!-- Método de Contraseña -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        Método de Contraseña <span class="text-red-500">*</span>
                    </label>
                    <div class="space-y-2">
                        <label class="flex items-start cursor-pointer p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition" id="labelAutomatica">
                            <input type="radio" name="metodo_password" value="automatica" checked
                                class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500" onchange="alternarMetodoPassword()">
                            <div class="ml-3">
                                <span class="font-medium text-gray-900">Generar contraseña temporal automática</span>
                                <p class="text-xs text-gray-600 mt-1">El sistema generará una contraseña segura de 12 caracteres</p>
                            </div>
                        </label>
                        <label class="flex items-start cursor-pointer p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition" id="labelManual">
                            <input type="radio" name="metodo_password" value="manual"
                                class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500" onchange="alternarMetodoPassword()">
                            <div class="ml-3">
                                <span class="font-medium text-gray-900">Establecer contraseña manualmente</span>
                                <p class="text-xs text-gray-600 mt-1">Ingrese una contraseña personalizada</p>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Contraseña Automática -->
                <div id="passwordAutomaticaSection" class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña Generada
                    </label>
                    <div class="relative">
                        <input type="text" id="passwordGenerada" readonly
                            class="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                            placeholder="Click en 'Generar' para crear contraseña">
                        <button type="button" onclick="copiarPasswordGenerada()"
                            class="absolute right-12 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700" title="Copiar">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </button>
                        <button type="button" onclick="toggleVisibilidadPasswordGenerada()"
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" title="Mostrar/Ocultar">
                            <svg id="iconoOjoGenerada" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                    </div>
                    <button type="button" onclick="generarPasswordAutomatica()"
                        class="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Generar Nueva Contraseña
                    </button>
                </div>

                <!-- Contraseña Manual -->
                <div id="passwordManualSection" class="hidden mb-4">
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nueva Contraseña <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <input type="password" id="passwordManual"
                                    class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Mínimo 8 caracteres"
                                    oninput="verificarFortalezaPasswordReset()">
                                <button type="button" onclick="alternarVisibilidadPassword('passwordManual')"
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                </button>
                            </div>
                            <span id="errorPasswordManual" class="error-message text-red-500 text-xs hidden"></span>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <input type="password" id="passwordManualConfirm"
                                    class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Repita la contraseña"
                                    oninput="verificarCoincidenciaPasswordReset()">
                                <button type="button" onclick="alternarVisibilidadPassword('passwordManualConfirm')"
                                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                </button>
                            </div>
                            <span id="errorPasswordManualConfirm" class="error-message text-red-500 text-xs hidden"></span>
                        </div>
                    </div>
                </div>

                <!-- Indicador de Fortaleza -->
                <div class="mb-4">
                    <div class="flex gap-1">
                        <div id="resetStrength1" class="h-1 flex-1 bg-gray-200 rounded"></div>
                        <div id="resetStrength2" class="h-1 flex-1 bg-gray-200 rounded"></div>
                        <div id="resetStrength3" class="h-1 flex-1 bg-gray-200 rounded"></div>
                        <div id="resetStrength4" class="h-1 flex-1 bg-gray-200 rounded"></div>
                    </div>
                    <p id="resetStrengthLabel" class="text-xs text-gray-500 mt-1">Fortaleza de contraseña</p>
                </div>

                <!-- Opciones -->
                <div class="space-y-3 mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="forzarCambio" checked
                            class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                        <span class="ml-2 text-sm text-gray-700">Forzar cambio de contraseña en próximo login</span>
                    </label>

                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="enviarEmail" checked
                            class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                        <span class="ml-2 text-sm text-gray-700">Enviar contraseña por email al usuario</span>
                    </label>

                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="cerrarSesiones" checked
                            class="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded">
                        <span class="ml-2 text-sm text-gray-700">Cerrar sesiones activas del usuario</span>
                    </label>
                </div>

                <!-- Advertencia de Sesión Activa -->
                <div id="warningSessionActiva" class="hidden mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <div class="flex items-start">
                        <svg class="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <div>
                            <h4 class="font-semibold text-yellow-800">Este usuario tiene sesiones activas</h4>
                            <p class="text-sm text-yellow-700 mt-1">
                                Se recomienda cerrar las sesiones activas para mayor seguridad. La opción está marcada por defecto.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Advertencia de Seguridad -->
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div class="flex items-start">
                        <svg class="w-6 h-6 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        <div>
                            <h4 class="font-semibold text-red-800">Advertencia de Seguridad</h4>
                            <p class="text-sm text-red-700 mt-1">
                                Esta acción restablecerá la contraseña del usuario. Si elige enviar por email, asegúrese de que el correo electrónico sea correcto.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3" style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                <button type="button" onclick="cerrarModalRestablecerPassword()"
                    class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cancelar
                </button>
                <button type="button" id="btnRestablecerPassword" onclick="confirmarRestablecerPassword()"
                    class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
                    Restablecer Contraseña
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Gestionar Roles -->
    <div id="manageRolesModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-4xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="manageRolesTitle" class="text-xl font-semibold text-white">Gestionar Roles de Usuario</h3>
                    <button type="button" onclick="cerrarModalGestionarRoles()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <!-- User Info -->
                <div class="flex items-center mb-6 pb-4 border-b border-gray-200">
                    <div id="manageRolesUserPhoto" class="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <div class="ml-4 flex-1">
                        <h4 id="manageRolesUserName" class="text-lg font-semibold text-gray-900"></h4>
                        <p id="manageRolesUserEmail" class="text-sm text-gray-600"></p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Columna Izquierda: Roles Actuales y Agregar -->
                    <div>
                        <!-- Roles Actuales -->
                        <div class="mb-6">
                            <h4 class="text-sm font-semibold text-gray-700 mb-3">Roles Actuales</h4>
                            <div id="rolesActualesContainer" class="border border-gray-300 rounded-lg p-4 min-h-[120px] bg-gray-50">
                                <p class="text-gray-500 text-sm">Cargando roles...</p>
                            </div>
                        </div>

                        <!-- Agregar Roles -->
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-3">Agregar Roles</h4>
                            <div class="mb-3">
                                <select id="selectRolesDisponibles"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    onchange="agregarRolTemporal()">
                                    <option value="">Seleccione un rol...</option>
                                </select>
                            </div>

                            <!-- Vista previa del rol seleccionado -->
                            <div id="vistaPreviaRolSeleccionado" class="hidden bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <h5 class="text-xs font-semibold text-purple-800 mb-2">Vista Previa del Rol</h5>
                                <div id="permisosRolSeleccionado" class="text-xs text-gray-700 max-h-32 overflow-y-auto">
                                    <!-- Permisos se cargarán aquí -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna Derecha: Vista Previa de Permisos -->
                    <div>
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Vista Previa de Permisos</h4>
                        <div class="border border-gray-300 rounded-lg p-4 bg-blue-50 max-h-[400px] overflow-y-auto">
                            <p class="text-xs text-gray-600 mb-3">Permisos que tendrá el usuario después de guardar:</p>
                            <div id="vistaPreviaPermisos" class="space-y-3">
                                <!-- Permisos agrupados por módulo se cargarán aquí -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notificar al usuario -->
                <div class="mt-6">
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" id="notificarCambioRoles" checked
                            class="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded">
                        <span class="ml-2 text-sm text-gray-700">Notificar al usuario del cambio de roles por email</span>
                    </label>
                </div>

                <!-- Advertencias dinámicas -->
                <div id="advertenciasGestionRoles" class="mt-4 space-y-3">
                    <!-- Las advertencias se mostrarán aquí dinámicamente -->
                </div>

                <!-- Advertencia sesión activa -->
                <div id="warningSessionActivaRoles" class="hidden mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <div class="flex items-start">
                        <svg class="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <div class="flex-1">
                            <h4 class="font-semibold text-yellow-800">Usuario tiene sesión activa</h4>
                            <p class="text-sm text-yellow-700 mt-1">
                                Los cambios aplicarán en su próximo inicio de sesión.
                            </p>
                            <label class="flex items-center mt-2 cursor-pointer">
                                <input type="checkbox" id="cerrarSesionUsuario"
                                    class="w-4 h-4 text-yellow-600 focus:ring-yellow-500 rounded">
                                <span class="ml-2 text-sm text-yellow-800 font-medium">Cerrar sesión del usuario ahora</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3" style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                <button type="button" onclick="cerrarModalGestionarRoles()"
                    class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    Cancelar
                </button>
                <button type="button" id="btnGuardarRoles" onclick="confirmarGuardarRoles()"
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                    Guardar Cambios
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Crear/Editar Rol -->
    <div id="roleModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-3xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="roleModalTitle" class="text-xl font-semibold text-white">Crear Nuevo Rol</h3>
                    <button type="button" onclick="cerrarModalRol()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="roleForm" class="bg-white" style="border-radius: 20px;">
                <div class="px-6 py-4">
                    <div class="grid grid-cols-1 gap-4">
                        <!-- Nombre del Rol -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Rol <span class="text-red-500">*</span>
                            </label>
                            <input type="text" name="nombre" id="rolNombre" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Ej: Analista de Proyectos"
                                oninput="generarSlugRol()">
                            <span class="error-message text-red-500 text-xs hidden"></span>
                        </div>

                        <!-- Slug (identificador único) -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Slug (Identificador Único) <span class="text-red-500">*</span>
                                <button type="button" onclick="regenerarSlugRol()" 
                                    class="ml-2 text-xs text-purple-600 hover:text-purple-800"
                                    title="Regenerar desde el nombre">
                                    <svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </label>
                            <input type="text" name="slug" id="rolSlug" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                                placeholder="ej: analista-de-proyectos"
                                pattern="[-a-z0-9]+"
                                title="Solo letras minúsculas, números y guiones">
                            <p class="text-xs text-gray-500 mt-1">
                                <span class="inline-flex items-center">
                                    <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                    </svg>
                                    Se genera automáticamente del nombre. Debe ser único en el sistema.
                                </span>
                            </p>
                            <span class="error-message text-red-500 text-xs hidden"></span>
                            <div id="slugAvailability" class="text-xs mt-1 hidden"></div>
                        </div>

                        <!-- Descripción -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea name="descripcion" id="rolDescripcion" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Breve descripción del rol y sus responsabilidades"></textarea>
                        </div>

                        <!-- Área (opcional) -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Área Específica (Opcional)
                            </label>
                            <select name="area_id" id="rolAreaId"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="">Sin área específica (Global)</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">Si se selecciona un área, solo usuarios de esa área pueden tener este rol</p>
                        </div>

                        <!-- Estado -->
                        <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Rol Activo</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="activo" id="rolActivo" checked class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        <!-- Advertencia para roles del sistema -->
                        <div id="warningRolSistema" class="hidden bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <div class="flex items-start">
                                <svg class="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                <div>
                                    <h4 class="font-semibold text-yellow-800">Rol del Sistema</h4>
                                    <p class="text-sm text-yellow-700 mt-1">
                                        Este es un rol del sistema. Solo puede modificar la descripción y el estado.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3" style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                    <button type="button" onclick="cerrarModalRol()"
                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit" id="btnGuardarRol"
                        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                        Guardar Rol
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Gestionar Permisos -->
    <div id="permisosModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto mb-10 p-0 border w-11/12 max-w-5xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 id="permisosModalTitle" class="text-xl font-semibold text-white">Gestionar Permisos del Rol</h3>
                    <button type="button" onclick="cerrarModalPermisos()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <!-- Info del Rol -->
                <div class="mb-6 pb-4 border-b border-gray-200">
                    <h4 id="permisosRolNombre" class="text-lg font-semibold text-gray-900"></h4>
                    <p id="permisosRolDescripcion" class="text-sm text-gray-600"></p>
                </div>

                <!-- Búsqueda y acciones rápidas -->
                <div class="mb-4 flex gap-3">
                    <input type="text" id="searchPermisos" placeholder="Buscar permisos..."
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        oninput="filtrarPermisos()">
                    <button type="button" onclick="seleccionarTodosPermisos()"
                        class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm">
                        Seleccionar Todos
                    </button>
                    <button type="button" onclick="deseleccionarTodosPermisos()"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm">
                        Deseleccionar Todos
                    </button>
                </div>

                <!-- Permisos agrupados por módulo -->
                <div id="permisosContainer" class="space-y-4">
                    <!-- Los permisos se cargarán aquí agrupados por módulo -->
                    <div class="text-center text-gray-500 py-8">
                        <svg class="w-12 h-12 mx-auto mb-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Cargando permisos...</p>
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center" style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                <div class="text-sm text-gray-600">
                    <span id="contadorPermisos">0 permisos seleccionados</span>
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="cerrarModalPermisos()"
                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="button" id="btnGuardarPermisos" onclick="guardarPermisosRol()"
                        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                        Guardar Permisos
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Clonar Rol -->
    <div id="clonarRolModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-0 border w-11/12 max-w-2xl shadow-lg bg-white" style="border-radius: 20px;">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700" style="border-top-left-radius: 20px; border-top-right-radius: 20px;">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-semibold text-white">Clonar Rol</h3>
                    <button type="button" onclick="cerrarModalClonarRol()" class="text-white hover:text-gray-200 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Modal Body -->
            <form id="clonarRolForm" class="bg-white">
                <div class="px-6 py-4">
                    <!-- Rol origen -->
                    <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="text-sm font-semibold text-blue-800 mb-2">Rol Original</h4>
                        <p id="clonarRolOrigen" class="text-lg font-semibold text-gray-900"></p>
                        <p id="clonarRolOrigenDesc" class="text-sm text-gray-600 mt-1"></p>
                        <div class="mt-2 text-sm text-gray-700">
                            <span class="font-medium">Permisos:</span>
                            <span id="clonarRolPermisos" class="ml-1"></span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4">
                        <!-- Nombre del nuevo rol -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Nuevo Rol <span class="text-red-500">*</span>
                            </label>
                            <input type="text" name="nombre" id="clonarNombre" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Ej: Analista Senior"
                                oninput="generarSlugClonar()">
                            <span class="error-message text-red-500 text-xs hidden"></span>
                        </div>

                        <!-- Slug -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Slug (Identificador Único) <span class="text-red-500">*</span>
                                <button type="button" onclick="regenerarSlugClonar()" 
                                    class="ml-2 text-xs text-green-600 hover:text-green-800"
                                    title="Regenerar desde el nombre">
                                    <svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </label>
                            <input type="text" name="slug" id="clonarSlug" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                placeholder="ej: analista-senior"
                                pattern="[-a-z0-9]+"
                                title="Solo letras minúsculas, números y guiones">
                            <p class="text-xs text-gray-500 mt-1">Se genera automáticamente del nombre</p>
                            <span class="error-message text-red-500 text-xs hidden"></span>
                        </div>

                        <!-- Descripción -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea name="descripcion" id="clonarDescripcion" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Descripción del nuevo rol"></textarea>
                        </div>

                        <!-- Área -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Área Específica
                            </label>
                            <select name="area_id" id="clonarAreaId"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                <option value="">Sin área específica (Global)</option>
                            </select>
                        </div>

                        <!-- Opciones de clonación -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h5 class="font-semibold text-gray-700 mb-3">Opciones de Clonación</h5>
                            <div class="space-y-2">
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="clonarPermisos" checked
                                        class="w-4 h-4 text-green-600 focus:ring-green-500 rounded">
                                    <span class="ml-2 text-sm text-gray-700">Copiar permisos del rol original</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="clonarActivo" checked
                                        class="w-4 h-4 text-green-600 focus:ring-green-500 rounded">
                                    <span class="ml-2 text-sm text-gray-700">Activar rol automáticamente</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3" style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
                    <button type="button" onclick="cerrarModalClonarRol()"
                        class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit" id="btnClonarRol"
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                        Clonar Rol
                    </button>
                </div>
            </form>
        </div>
    </div>

    @push('styles')
    <link rel="stylesheet" href="{{ asset('css/admin/usuarios-modal.css') }}">
    @endpush

    @push('scripts')
    <script src="{{ asset('js/admin/usuarios.js') }}"></script>
    @endpush
</x-app-layout>