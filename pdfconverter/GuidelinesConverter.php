<?php

require_once("./fpdf181/fpdf.php");
include_once("./Converter.php");
include_once("./fpdf181/font/helvetica.php");
include_once("./pdf/GuidelinesPDF.php");

class GuidelinesConverter implements Converter
{
    private $pdf;

    const DEFAULTFONT = "helvetica";

    public function __construct($json, $language)
    {
        $this->json = $json;

        $result["state"] = "failed";
        $result["error"] = "";

        try {
            $this->pdf = new GuidelinesPDF($json, $language);

            $result["state"] = "success";
            return $result;
        } catch (Exception $ex) {
            $result["error"] = $ex->getMessage();
            return $result;
        }
    }

    public function output(){
        $project = $this->json->meta->project;
        $this->pdf->Output("", "Guidelines-$project", true);
    }

    private function y(){
        return $this->pdf->GetY();
    }

    private function x(){
        return $this->pdf->GetX();
    }
}