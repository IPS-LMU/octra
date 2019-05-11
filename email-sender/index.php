<?php
// SETTINGS
$to_email = '';
$auth_token = '';

// Do not set this in production environment
// header('Access-Control-Allow-Origin: *');

header('Access-Control-Allow-Headers: authorization, content-type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
$data = $_POST["data"];

function getHTMLText($data, $screenshots)
{
    print_r($data);
    ob_start();
    global $topic, $from_email;
    ?>
    <html>
    <head>
        <title><?php echo $topic; ?></title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
            * {
                font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
            }

            h2 {
                margin-bottom: 1px;
            }

            table {
                border-collapse: collapse;
                width: 100%;
            }

            table tr td {
                border: 1px solid gray;
                vertical-align: top;
                text-align: left;
                padding: 5px;
            }

            table tr .left {
                width: 100px;
            }

            table thead tr th {
                border: 1px solid black;
                text-align: center;
            }

            .fa-exclamation-triangle {
                color: orange;
            }

            .num-col {
                text-align: center;
            }

            .type-col {
                width: 30px !important;
                text-align: center;
            }

            .fa-info-circle {
                color: cornflowerblue;
            }

            .fa-times-circle {
                color: red;
            }

            .fa-comment-alt {
                color: lightgray;
            }

            tr:nth-child(even) {
                background-color: #f2f2f2
            }

            #error-table {
                margin-bottom: 20px;
            }

            #octra-table {
                margin-bottom: 20px;
            }

            #error-table td {
                text-align: center;
            }

            .url {
                margin-bottom: 30px;
                display: block;
            }

            img {
                height: 16px;
            }

            .message {
                font-style: italic;
            }

            .container {
                max-width: 970px;
                margin: 20px auto;
                border: 1px solid whitesmoke;
                padding: 40px;
                box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
            }

            .date-col {
                width: 50px;
            }

            .error {
                color: red;
            }

            .screenshot {
                display: block;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                border: 1px solid gray;
            }
        </style>
    </head>
    <body>
    <div class="container">
        <h2><?php echo $topic; ?></h2>
        <span class="url">Installation: <a
                    href="<?php echo $data["report"]["octra"]["url"]; ?>"><?php echo $data["report"]["octra"]["url"]; ?></a></span>
        <table style='width:100%;'>
            <tr>
                <td class='left'>Message:</td>
                <td class="message"><?php echo str_replace("\n", "<br/>", $data["description"]); ?></td>
            </tr>
            <tr>
                <td class='left'>Email Address:</td>
                <td><?php echo $from_email; ?></td>
            </tr>
            <tr>
                <td class='left'>OS:</td>
                <td><?php echo $data["os"] . " " . $data["os_build"]; ?></td>
            </tr>
            <tr>
                <td class='left'>Platform:</td>
                <td><?php echo $data["platform"] . " " . $data["version"]; ?></td>
            </tr>
        </table>
        <h3>Report:</h3>
        <?php if (!empty($data["report"])):
            $errors = 0;
            $logs = count($data["report"]["entries"]);
            $warnings = 0;
            $infos = 0;

            foreach ($data["report"]["entries"] as $entry) {
                switch ($entry["type"]) {
                    case(1):
                        $infos++;
                        break;
                    case(2):
                        $warnings++;
                        break;
                    case(3):
                        $errors++;
                        break;
                }
            }
            ?>

            <table id="octra-table">
                <tbody>
                <?php foreach ($data["report"]["octra"] as $key => $value): ?>
                    <tr>
                        <td><?php echo $key; ?></td>
                        <td><?php echo $value; ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <?php if (sizeof($screenshots) > 0): ?>
            <p>Screenshots:</p>
            <div class="screenshots">
                <?php foreach ($screenshots as $screenshot): ?>
                    <img class="screenshot" src="data:image/png;base64,<?php echo $screenshot["data"]; ?>"
                         alt="scrrenshot"/>
                    <br/>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

            <table id="error-table">
                <thead>
                <tr>
                    <th>Errors:</th>
                    <th>Warnings:</th>
                    <th>Information:</th>
                    <th>Total items:</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td><?php echo $errors; ?></td>
                    <td><?php echo $warnings; ?></td>
                    <td><?php echo $infos; ?></td>
                    <td><?php echo $logs; ?></td>
                </tr>
                </tbody>
            </table>

            <table>
                <thead>
                <tr>
                    <th class="num-col">#</th>
                    <th class="date-col">Date</th>
                    <th class="type-col">Type</th>
                    <th>Description</th>
                </tr>
                </thead>
                <tbody>
                <?php
                $number = 0;
                $max_decimals = 0;
                if (count($data["report"]["entries"]) > 0) {
                    $last_number = count($data["report"]["entries"]);
                    $max_decimals = strlen((string)$last_number);
                }
                foreach ($data["report"]["entries"] as $entry):
                    $number++;
                    $lineNumber = sprintf('%0' . $max_decimals . 'd', $number);
                    ?>

                    <tr>
                        <td class="num-col"><?php echo $lineNumber; ?></td>
                        <td class="date-col"><?php echo (!empty($entry["timestamp"])) ? $entry["timestamp"] : "No date recorded"; ?></td>
                        <td class="type-col">
                            <?php switch ($entry["type"]):
                                case(0):
                                    ?>
                                    <img src="https://www.phonetik.uni-muenchen.de/apps/octra/email-sender/pencil.png"
                                         alt="0"/>
                                    <?php break; ?>
                                <?php case(1): ?>
                                    <img src="https://www.phonetik.uni-muenchen.de/apps/octra/email-sender/question.png"
                                         alt="1"/>
                                    <?php break; ?>
                                <?php case(2): ?>
                                    <img src="https://www.phonetik.uni-muenchen.de/apps/octra/email-sender/warning.png"
                                         alt="2"/>
                                    <?php break; ?>
                                <?php case(3): ?>
                                    <img src="https://www.phonetik.uni-muenchen.de/apps/octra/email-sender/error.png"
                                         alt="3"/>
                                    <?php break; ?>
                                <?php endswitch; ?>
                        </td>
                        <td <?php if ($entry["type"] === 3) {
                            echo "class='error'";
                        } ?>><?php echo str_replace("\n", "<br/>", $entry["message"]); ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>No protocol available.</p>
        <?php endif; ?>
    </div>
    </body>
    </html>
    <?php
    $content = ob_get_contents();
    ob_end_clean();
    return $content;
}

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

    if (!is_null($data["additional_information"]) && !is_null($data["description"])) {

        $attachments = array();
        foreach ($_FILES AS $file) {
            echo "read file " . $file["tmp_name"];
            $size = $file["size"];
            $file_data = file_get_contents($file["tmp_name"]);
            $file_data = base64_encode($file_data);
            $type = $file["type"];

            $attachments[] = array("name" => $file["name"], "size" => $size, "type" => $type, "data" => $file_data);
        }

        $from_email = $data["additional_information"]["email"];
        $timestamp = date("Y-m-d-H-i-s");
        $topic = "OCTRA Feedback [$timestamp]";


        if (empty($from_email)) {
            $from_email = "do-not-reply@octra.net";
        }

        $separator = md5(uniqid(microtime(), true));
        $eol = "\r\n";

        $header = "From: " . $from_email . $eol;
        $header .= "Reply-To: " . $from_email . $eol;

        $header .= "MIME-Version: 1.0" . $eol;
        $header .= "Content-Type: multipart/mixed; boundary=\"" . $separator . "\"" . $eol;
        $header .= "Content-Transfer-Encoding: 8bit" . $eol;
        $header .= "This is a MIME encoded message." . $eol;

        // message
        $body = "--" . $separator . $eol;
        $body .= "Content-Type: text/html; charset=\"UTF-8\"" . $eol;
        $body .= "Content-Transfer-Encoding: 8bit" . $eol . $eol;
        $body .= getHTMLText($data, $attachments) . $eol;

        //attachments
        /*
        foreach($attachments as $file){
            print_r($file);
            $data = chunk_split(base64_encode($file['data']));
            $body .= "--" . $separator . $eol;
            $body .= "Content-Location: CID:somethingatelse ;\r\n";
            $body .= "Content-ID: <my50kphoto>;\r\n";
            $body.= "Content-Disposition: attachment;\r\n";
            $body.= "\tfilename=\"".$file['name']."\";\r\n";
            $body.= "Content-Length: .".$file['size'].";\r\n";
            $body.= "Content-Type: ".$file['type'].";\r\n";
            $body.= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body.= $data."\r\n";
        }*/
        $body .= "--" . $separator . "--";

        echo "send email to $to_email from $from_email, with topic $topic";
        $send_ok = mail($to_email, $topic, $body, $header);

        if (!$send_ok) {
            $result["status"] = 'failed';
            $result["error"] = 'could not send mail';
        } else {
            $result["status"] = "success";
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