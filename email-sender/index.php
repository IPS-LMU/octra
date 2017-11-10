<?php
// SETTINGS
$to_email = '';
$auth_token = '';

// Do not set this in production environment
// header('Access-Control-Allow-Origin: *');

header('Access-Control-Allow-Headers: authorization, content-type');
header('Access-Control-Allow-Methods: POST');
$data = file_get_contents("php://input");

if (!function_exists('getallheaders')) {
    function getallheaders()
    {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
$headers = getallheaders();

$result = array(
    "status" => "failed",
    "error" => ""
);

if (!empty($data) && !is_null($headers["Authorization"]) && $headers["Authorization"] === $auth_token) {
    $data = json_decode($data, true);

    if (!is_null($data["additional_information"]) && !is_null($data["description"]) && !is_null($data["os"]) && !is_null($data["os_build"])
        && !is_null($data["platform"]) && !is_null($data["version"]) && !is_null($data["report"])) {

        $from_email = $data["additional_information"]["email"];
        $timestamp = date("Y-m-d-H-i-s");
        $topic = "OCTRA BUG [$timestamp]";
        $text = "<html>
<head>
<style>
table tr td{
border:1px solid gray;
vertical-align:top;
text-align:left;
}

table tr .left{
 max-width: 50px;
}
</style>
</head>
<body>
<h3>OCTRA BUG [$timestamp]</h3>
A user sent a new bug report.<br/><br/>
        <table style='width:100%;'>
        <tr><td class='left'>Email Address:</td><td>$from_email</td></tr>
        <tr><td class='left'>Description:</td><td>" . str_replace("\n", "<br/>", $data["description"]) . "</td></tr>
        <tr><td class='left'>OS:</td><td>" . $data["os"] . " " . $data["os_build"] . "</td></tr>
        <tr><td class='left'>Platform:</td><td>" . $data["platform"] . " " . $data["version"] . "</td></tr>
</table>
<br/><br/>
        Please have a look on the attachment<br><br>
        --- This message was auto generated ---
        </body>
        </html>";

        $file = null;
        $bugreport = $data["report"];
        $file_name = "octrabug-$timestamp" . ".txt";
        $written = file_put_contents($file_name, $bugreport);

        if ($written !== FALSE) {
            $file = fopen($file_name, 'r');
        }
        if (is_null($file)) {
            $result["status"] = "failed";
            $result["error"] = "File is null";
        } else {
            if (empty($from_email)) {
                $from_email = "do-not-reply@octra.net";
            }
            $attachment = chunk_split(base64_encode($bugreport));
            $size = filesize($file_name);

            $boundary = "-----=" . md5(uniqid(microtime(), true));

            $header = "From: " . $from_email . "\n";
            $header .= "Reply-To: " . $from_email . "\n";

            $header .= "MIME-Version: 1.0\r\n";
            $header .= "Content-Type: multipart/mixed;\r\n";
            $header .= " boundary=\"" . $boundary . "\"\r\n";

            $content = "This is a multi-part message in MIME format.\r\n\r\n";
            $content .= "--" . $boundary . "\r\n";
            $content .= "Content-Type: text/html; charset=\"utf8\"\r\n";
            $content .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $content .= $text . "\r\n";

            $data = chunk_split(base64_encode($bugreport));
            $content .= "--" . $boundary . "\r\n";
            $content .= "Content-Disposition: attachment;\r\n";
            $content .= "\tfilename=\"" . $file_name . "\";\r\n";
            $content .= "Content-Length: ." . $size . ";\r\n";
            $content .= "Content-Type: text/plain; name=\"" . $file_name . "\"\r\n";
            $content .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $content .= $data . "\r\n";

            $content .= "--" . $boundary . "--";
            $send_ok = mail($to_email, $topic, $content, $header);

            if (!$send_ok) {
                $result["status"] = 'failed';
                $result["error"] = 'could not send mail';
            } else {
                $result["status"] = "success";
            }
            unlink($file_name);
        }
    } else {
        $result["status"] = "failed";
        $result["error"] = "Object posted does not have valid attributes";
    }
} else {
    $result = array(
        "status" => "failed",
        "error" => "No Post request or invalid auth token"
    );
}

echo json_encode($result);

?>
