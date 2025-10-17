<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dependencia;
use Illuminate\Http\Request;

class DependenciasController extends Controller
{
    public function index(Request $request)
    {
       if ($request->ajax()) {
       
       }
        return view('admin.dependencias.index');
    }
}
