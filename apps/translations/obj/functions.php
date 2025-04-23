<?php
/**
 * Created by PhpStorm.
 * User: uni
 * Date: 01.10.17
 * Time: 10:35
 */

 function logC($obj) {
    $str = "";
    if(is_string($obj)) {
        $str = "'".str_replace("'", "\\'", str_replace("\n", "\\n", $obj))."'";
    } else {
        $str = json_encode($obj);
    }
    echo "<script type=\"application/javascript\">console.log(".$str.");</script>";
 }

?>
