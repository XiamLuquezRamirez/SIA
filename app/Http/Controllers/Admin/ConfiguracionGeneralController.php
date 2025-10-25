<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionGeneral;
use Illuminate\Http\Request;

class ConfiguracionGeneralController extends Controller
{
    public function index(Request $request)
    {
        if($request->ajax()){
            $configuracionGeneral = ConfiguracionGeneral::with('createdBy')->first();

            return response()->json([
                'configuracionGeneral' => $configuracionGeneral
            ]);
        }

        return view('admin.configuracion-general.index');

    }
}
