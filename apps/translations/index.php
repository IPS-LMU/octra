<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
include("./config.php");

if (strpos($_SERVER["REQUEST_URI"], ".php") === false) {
    $actual_link = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
    header("Location: {$actual_link}start.php");
    exit();
};
// read languages from folder
$files = scandir("./translations");

$languages = array();

if (empty($_SESSION["selected_lang"])) {
    $_SESSION["selected_lang"] = "de";
}

if (!empty($_GET["lang"])):
    $_SESSION["selected_lang"] = $_GET["lang"];
endif;

foreach ($files as $file):
    if (!is_dir($file)):
        try {
            $lang = substr($file, strrpos($file, "_") + 1, 2);
            $languages[] = $lang;
        } catch (Exception $ex) {

        }
    endif;
endforeach;

include_once("./gui/header.php");

// custom
$uri = $_SERVER["REQUEST_URI"];
global $include_page;
$include_page = "start";

if ($uri !== "/translation-manager/") {
    $start = strripos($uri, "/") + 1;
    $length = strripos($uri, ".php") - $start;
    $include_page = substr($uri, $start, $length);
}
?>
<?php include_once("./gui/wrapper.php"); ?>

<?php
include_once("./pages/$include_page.php");
?>
<?php include_once("./gui/footer.php"); ?>