

<?php
include_once("./obj/functions.php");
/**
 * Created by PhpStorm.
 * User: uni
 * Date: 01.10.17
 * Time: 10:38
 */

class LanguagePackage
{
    private $code;
    private $label;
    private $filename;
    private $json;
    private $change_date;

    public function __construct($code, $label, $filename, $change_date = null, $json = null)
    {
        if (!empty($code) && !empty($label) && !empty($filename)) {
            $this->code = $code;
            $this->label = $label;
            $this->filename = $filename;
            $this->json = $json;
            $this->change_date = $change_date;
        } else {
            throw new Exception("parameters of LanguagePackage must not be empty");
        }
    }

    public function getCode()
    {
        return $this->code;
    }

    public function getLabel()
    {
        return $this->label;
    }

    public function getJSON()
    {
        return $this->json;
    }

    public function getFileName()
    {
        return $this->filename;
    }

    public function getChangeDate()
    {
        return $this->change_date;
    }
}