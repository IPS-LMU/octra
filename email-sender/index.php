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


        if (empty($from_email)) {
            $from_email = "do-not-reply@octra.net";
        }

        $boundary = "-----=" . md5(uniqid(microtime(), true));

        $header = "From: " . $from_email . "\n";
        $header .= "Reply-To: " . $from_email . "\n";

        $header .= "MIME-Version: 1.0\r\n";
        $header .= "Content-Type: text/html; charset=UTF-8\r\n";

        $content = "";
        ob_start();
        ?>
        <html>
        <head>
            <title><?php echo $topic; ?></title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
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
                padding: 3px;
            }

            table tr .left {
                max-width: 50px;
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
                height: 24px;
            }

            .message {
                font-style: italic;
            }
        </style>
        <body>
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
                        <td class="type-col">
                            <?php switch ($entry["type"]):
                                case(0):
                                    ?>
                                    <img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNDk4Ljc5MSwxNjEuMTI3Yy0xNy41NDUtMTcuNTQ2LTQ2LjA5NC0xNy41NDUtNjMuNjQ1LDAuMDA0Yy01LjM5OCw1LjQwMy0zOS44NjMsMzkuODk2LTQ1LjEyOCw0NS4xNjZWODcuNDI2ICAgIGMwLTEyLjAyLTQuNjgxLTIzLjMyLTEzLjE4MS0zMS44MTlMMzM0LjQxMiwxMy4xOEMzMjUuOTEzLDQuNjgsMzE0LjYxMiwwLDMwMi41OTIsMEg0NS4wMThjLTI0LjgxMywwLTQ1LDIwLjE4Ny00NSw0NXY0MjIgICAgYzAsMjQuODEzLDIwLjE4Nyw0NSw0NSw0NWgzMDBjMjQuODEzLDAsNDUtMjAuMTg3LDQ1LTQ1VjMzMy42MzFMNDk4Ljc5LDIyNC43NjdDNTE2LjM3NywyMDcuMTgxLDUxNi4zODEsMTc4LjcxNSw0OTguNzkxLDE2MS4xMjcgICAgeiBNMzAwLjAxOSwzMGMyLjgzNCwwLDguMjk1LTAuNDkxLDEzLjE4LDQuMzkzbDQyLjQyNiw0Mi40MjdjNC43Niw0Ljc2MSw0LjM5NCw5Ljk3OCw0LjM5NCwxMy4xOGgtNjBWMzB6IE0zNjAuMDE4LDQ2NyAgICBjMCw4LjI3MS02LjcyOCwxNS0xNSwxNWgtMzAwYy04LjI3MSwwLTE1LTYuNzI5LTE1LTE1VjQ1YzAtOC4yNzEsNi43MjktMTUsMTUtMTVoMjI1djc1YzAsOC4yODQsNi43MTYsMTUsMTUsMTVoNzV2MTE2LjMyMyAgICBjMCwwLTQ0LjI1NCw0NC4yOTItNDQuMjU2LDQ0LjI5M2wtMjEuMjAzLDIxLjIwNGMtMS42NDYsMS42NDYtMi44ODgsMy42NTQtMy42MjQsNS44NjNsLTIxLjIxNCw2My42NCAgICBjLTEuNzk3LDUuMzktMC4zOTQsMTEuMzMzLDMuNjI0LDE1LjM1YzQuMDIzLDQuMDIzLDkuOTY4LDUuNDE5LDE1LjM1LDMuNjI0bDYzLjY0LTIxLjIxM2MyLjIwOS0wLjczNiw0LjIxNy0xLjk3Nyw1Ljg2My0zLjYyNCAgICBsMS44Mi0xLjgyVjQ2N3ogTTMyNi4zNzgsMzEyLjQyN2wyMS4yMTMsMjEuMjEzbC04LjEwMyw4LjEwM2wtMzEuODE5LDEwLjYwNmwxMC42MDYtMzEuODJMMzI2LjM3OCwzMTIuNDI3eiBNMzY4LjgsMzEyLjQyMiAgICBsLTIxLjIxMy0yMS4yMTNjMTEuMjk2LTExLjMwNSw2MS40NjUtNjEuNTE3LDcyLjEwNS03Mi4xNjZsMjEuMjEzLDIxLjIxM0wzNjguOCwzMTIuNDIyeiBNNDc3LjU3MywyMDMuNTU4bC0xNS40NjMsMTUuNDc2ICAgIGwtMjEuMjEzLTIxLjIxM2wxNS40NjgtMTUuNDgxYzUuODUyLTUuODQ5LDE1LjM2Ni01Ljg0OCwyMS4yMTQsMEM0ODMuNDI2LDE4OC4xOSw0ODMuNDU3LDE5Ny42NzMsNDc3LjU3MywyMDMuNTU4eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTI4NS4wMTgsMTUwaC0yMTBjLTguMjg0LDAtMTUsNi43MTYtMTUsMTVzNi43MTYsMTUsMTUsMTVoMjEwYzguMjg0LDAsMTUtNi43MTYsMTUtMTVTMjkzLjMwMiwxNTAsMjg1LjAxOCwxNTB6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjI1LjAxOCwyMTBoLTE1MGMtOC4yODQsMC0xNSw2LjcxNi0xNSwxNXM2LjcxNiwxNSwxNSwxNWgxNTBjOC4yODQsMCwxNS02LjcxNiwxNS0xNVMyMzMuMzAyLDIxMCwyMjUuMDE4LDIxMHoiIGZpbGw9IiMwMDAwMDAiLz4KCTwvZz4KPC9nPgo8Zz4KCTxnPgoJCTxwYXRoIGQ9Ik0yMjUuMDE4LDI3MGgtMTUwYy04LjI4NCwwLTE1LDYuNzE2LTE1LDE1czYuNzE2LDE1LDE1LDE1aDE1MGM4LjI4NCwwLDE1LTYuNzE2LDE1LTE1UzIzMy4zMDIsMjcwLDIyNS4wMTgsMjcweiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTIyNS4wMTgsMzMwaC0xNTBjLTguMjg0LDAtMTUsNi43MTYtMTUsMTVzNi43MTYsMTUsMTUsMTVoMTUwYzguMjg0LDAsMTUtNi43MTYsMTUtMTVTMjMzLjMwMiwzMzAsMjI1LjAxOCwzMzB6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjg1LjAxOCw0MjJoLTkwYy04LjI4NCwwLTE1LDYuNzE2LTE1LDE1czYuNzE2LDE1LDE1LDE1aDkwYzguMjg0LDAsMTUtNi43MTYsMTUtMTVTMjkzLjMwMiw0MjIsMjg1LjAxOCw0MjJ6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg=="/>
                                    <?php break; ?>
                                <?php case(1): ?>
                                    <img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQzNy42IDQzNy42IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0MzcuNiA0MzcuNjsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSIzMnB4IiBoZWlnaHQ9IjMycHgiPgo8Zz4KCTxnPgoJCTxnPgoJCQk8cGF0aCBkPSJNMTk0LDE0Mi44YzAuOCwxLjYsMS42LDMuMiwyLjQsNC40YzAuOCwxLjIsMiwyLjQsMi44LDMuNmMxLjIsMS4yLDIuNCwyLjQsNCwzLjZjMS4yLDAuOCwyLjgsMiw0LjgsMi40ICAgICBjMS42LDAuOCwzLjIsMS4yLDUuMiwxLjZjMiwwLjQsMy42LDAuNCw1LjIsMC40YzEuNiwwLDMuNiwwLDUuMi0wLjRjMS42LTAuNCwzLjItMC44LDQuNC0xLjZoMC40YzEuNi0wLjgsMy4yLTEuNiw0LjgtMi44ICAgICBjMS4yLTAuOCwyLjQtMiwzLjYtMy4ybDAuNC0wLjRjMS4yLTEuMiwyLTIuNCwyLjgtMy42czEuNi0yLjQsMi00YzAtMC40LDAtMC40LDAuNC0wLjhjMC44LTEuNiwxLjItMy42LDEuNi01LjIgICAgIGMwLjQtMS42LDAuNC0zLjYsMC40LTUuMnMwLTMuNi0wLjQtNS4yYy0wLjQtMS42LTAuOC0zLjItMS42LTUuMmMtMS4yLTIuOC0yLjgtNS4yLTQuOC03LjJjLTAuNC0wLjQtMC40LTAuNC0wLjgtMC44ICAgICBjLTEuMi0xLjItMi40LTItNC0zLjJjLTEuNi0wLjgtMi44LTEuNi00LjQtMi40Yy0xLjYtMC44LTMuMi0xLjItNC44LTEuNmMtMi0wLjQtMy42LTAuNC01LjItMC40Yy0xLjYsMC0zLjYsMC01LjIsMC40ICAgICBjLTEuNiwwLjQtMy4yLDAuOC00LjgsMS42SDIwOGMtMS42LDAuOC0zLjIsMS42LTQuNCwyLjRjLTEuNiwxLjItMi44LDItNCwzLjJjLTEuMiwxLjItMi40LDIuNC0zLjIsMy42ICAgICBjLTAuOCwxLjItMS42LDIuOC0yLjQsNC40Yy0wLjgsMS42LTEuMiwzLjItMS42LDQuOGMtMC40LDItMC40LDMuNi0wLjQsNS4yYzAsMS42LDAsMy42LDAuNCw1LjIgICAgIEMxOTIuOCwxMzkuNiwxOTMuNiwxNDEuMiwxOTQsMTQyLjh6IiBmaWxsPSIjMDA2REYwIi8+CgkJCTxwYXRoIGQ9Ik0yNDkuNiwyODkuMmgtOS4ydi05OGMwLTUuNi00LjQtMTAuNC0xMC40LTEwLjRoLTQyYy01LjYsMC0xMC40LDQuNC0xMC40LDEwLjR2MjEuNmMwLDUuNiw0LjQsMTAuNCwxMC40LDEwLjRoOC40djY2LjQgICAgIEgxODhjLTUuNiwwLTEwLjQsNC40LTEwLjQsMTAuNHYyMS42YzAsNS42LDQuNCwxMC40LDEwLjQsMTAuNGg2MS42YzUuNiwwLDEwLjQtNC40LDEwLjQtMTAuNFYzMDAgICAgIEMyNjAsMjk0LDI1NS4yLDI4OS4yLDI0OS42LDI4OS4yeiIgZmlsbD0iIzAwNkRGMCIvPgoJCQk8cGF0aCBkPSJNMjE4LjgsMEM5OCwwLDAsOTgsMCwyMTguOHM5OCwyMTguOCwyMTguOCwyMTguOHMyMTguOC05OCwyMTguOC0yMTguOFMzMzkuNiwwLDIxOC44LDB6IE0yMTguOCw0MDguOCAgICAgYy0xMDQuOCwwLTE5MC04NS4yLTE5MC0xOTBzODUuMi0xOTAsMTkwLTE5MHMxOTAsODUuMiwxOTAsMTkwUzMyMy42LDQwOC44LDIxOC44LDQwOC44eiIgZmlsbD0iIzAwNkRGMCIvPgoJCTwvZz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"/>
                                    <?php break; ?>
                                <?php case(2): ?>
                                    <img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMzJweCIgaGVpZ2h0PSIzMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNTAzLjQ3OSwzOTEuNjZMMzAyLjA2NSw1OC44NmMtMjMuMi0zOC42Ny03OS40NC0zOS4xLTEwMy4wNCwwLjI2TDguNTc1LDM5MS41MmMtMjMuODgsNDAuMDQsNC45NSw5MC43NSw1MS41Myw5MC43NSAgICBoMzkxLjc2NEM0OTguNzU5LDQ4Mi4yNyw1MjcuMTU5LDQzMS4xLDUwMy40NzksMzkxLjY2eiBNMjUwLjYyNCw0MjIuMjdjLTE2LjU0LDAtMzAtMTMuNDYtMzAtMzBjMC0xNi41NCwxMy40Ni0zMCwzMC0zMCAgICBjMTYuNTMsMCwzMCwxMy40NiwzMCwzMEMyODAuNjI0LDQwOC44MSwyNjcuMTU0LDQyMi4yNywyNTAuNjI0LDQyMi4yN3ogTTI4MS4wMjQsMjcyLjI3YzAsMTYuNTQtMTMuODcsMzAtMzAuNCwzMCAgICBjLTE2LjU0LDAtMjkuOC0xMy40Ni0yOS44LTMwdi0xMjBjMC0xNi41NCwxMy4yNi0zMCwyOS44LTMwYzE2LjUzLDAsMzAuNCwxMy40NiwzMC40LDMwVjI3Mi4yN3oiIGZpbGw9IiNGRkRBNDQiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K"/>
                                    <?php break; ?>
                                <?php case(3): ?>
                                    <img src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDI4IDI4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyOCAyODsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSIzMnB4IiBoZWlnaHQ9IjMycHgiPgo8Zz4KCTxnIGlkPSJ4Ij4KCQk8Zz4KCQkJPHBvbHlnb24gcG9pbnRzPSIyOCwyMi4zOTggMTkuNTk0LDE0IDI4LDUuNjAyIDIyLjM5OCwwIDE0LDguNDAyIDUuNTk4LDAgMCw1LjYwMiA4LjM5OCwxNCAwLDIyLjM5OCAgICAgIDUuNTk4LDI4IDE0LDE5LjU5OCAyMi4zOTgsMjggICAgIiBmaWxsPSIjRDgwMDI3Ii8+CgkJPC9nPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="/>
                                    <?php break; ?>
                                <?php endswitch; ?>
                        </td>
                        <td><?php echo $entry["message"]; ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>No protocol available.</p>
        <?php endif; ?>
        </body>
        </html>
        <?php
        $content = ob_get_contents();
        ob_end_clean();

        $send_ok = mail($to_email, $topic, $content, $header);

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