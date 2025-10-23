<x-app-layout>
    <x-slot name="title">Dependencias</x-slot>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Organigrama de Áreas y Equipos</h1>
                <p class="text-gray-600 text-sm">Ver el organigrama de áreas y equipos del sistema</p>
            </div>
        </div>
        <hr>
        <div id="tree" style="width:100%; height:700px;"></div>
    </div>
    @push('scripts')
    <script src="https://balkan.app/js/OrgChart.js"></script>
    <script src="{{ asset('js/admin/organigrama.js') }}"></script>
    @endpush
</x-app-layout>