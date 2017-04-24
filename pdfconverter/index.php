<?php
$result["state"] = "failed";
include("./GuidelinesConverter.php");
if(!empty($_POST) && !empty($_POST["json"])){
    //read  json
    $json = json_decode($_POST["json"]);

    if(isset($json->translation) && $json->guidelines) {
        $language = json_decode($json->tanslation);
        $guidelines = $json->guidelines;
        $guidelinesconverter = new GuidelinesConverter($guidelines, $json->translation);
        $guidelinesconverter->output();
        $result["state"] = "success";
    }
} else{
    $result["state"] = "error";
}
echo json_encode($result);
?>