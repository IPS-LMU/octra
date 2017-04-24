<?php

interface Converter
{
    public function __construct($json, $language);
    public function output();
}