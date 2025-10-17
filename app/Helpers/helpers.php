<?php

/**
 * Archivo de funciones helper globales para el SIA OAPM
 */

if (!function_exists('format_date_co')) {
    /**
     * Formatea una fecha al formato colombiano
     */
    function format_date_co($date, $format = 'd/m/Y H:i:s')
    {
        if (!$date) {
            return null;
        }

        return \Carbon\Carbon::parse($date)->format($format);
    }
}

if (!function_exists('generate_folio')) {
    /**
     * Genera un número de folio único para las PQRS
     */
    function generate_folio($prefix = 'PQRS')
    {
        $year = date('Y');
        $timestamp = time();
        return "{$prefix}-{$year}-{$timestamp}";
    }
}

if (!function_exists('format_currency_co')) {
    /**
     * Formatea un número al formato de moneda colombiano
     */
    function format_currency_co($amount)
    {
        return '$ ' . number_format($amount, 0, ',', '.');
    }
}
