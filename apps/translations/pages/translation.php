<?php
require_once("./obj/LanguagePackage.php");
require_once("./obj/translation_table.php");

use PHPMailer\PHPMailer\PHPMailer;

require('./sources/PHPMailer/PHPMailer.php');
require('./sources/PHPMailer/Exception.php');
?>
<div class="container">
    <h2>Start Translation</h2>
    <?php
    $fullname = "";
    $email = "";
    $mention_ok = "";
    $selected_lang = $_SESSION["selected_lang"];
    $error = "";

    if (!empty($_SESSION)) {
        if (!empty($_SESSION["user_fullname"])) {
            $fullname = $_SESSION["user_fullname"];
        }
        if (!empty($_SESSION["user_email"])) {
            $email = $_SESSION["user_email"];
        }
        if (!empty($_SESSION["mention_ok"])) {
            $mention_ok = ($_SESSION["mention_ok"]) ? "checked='checked'" : "";
        }
    }
    if (!empty($_POST)) {
        // something sent
        if (empty($_POST["json"])) {
            if (!empty($_POST["fullname"])) {
                $fullname = $_POST["fullname"];

                if (!empty($_POST["email"])) {
                    $email = $_POST["email"];

                    if (!empty($_POST["mention_ok"])) {
                        $mention_ok = "checked";
                    } else {
                        $mention_ok = "";
                    }
                }
            }

            if (!empty($fullname) && !empty($email)) {
                $_SESSION["user_fullname"] = $fullname;
                $_SESSION["user_email"] = $email;
                $_SESSION["mention_ok"] = ($mention_ok !== "");
            }
        } else {
            if (isset($selected_lang) && preg_match("/^\w{2}$/", $selected_lang)) {
                file_put_contents("./translations/".I18N_SLUG."_$selected_lang.json", $_POST["json"]);

                // send email
                $header = "From: " . $_SESSION["user_email"] . "\n";
                $header .= "Reply-To: " . $_SESSION["user_email"] . "\n";

                echo "<div class='alert alert-success'>Your translation was saved successfully.</div>";

                if (empty($_SESSION["last_sent"]) || (time() - $_SESSION["last_sent"]) > EMAIL_WAIT_TIME) {
                    $email = new PHPMailer();
                    $email->SetFrom($_SESSION["user_email"], utf8_decode($_SESSION["user_fullname"])); //Name is optional
                    $email->Subject = APP_NAME." - updated translation: $LANGUAGE_LABELS[$selected_lang]";
                    $email->Body = utf8_decode($_SESSION["user_fullname"]) . " translated ".APP_NAME." from English to $LANGUAGE_LABELS[$selected_lang].\n\n"
                        . "Information:\n"
                        . "Name: " . utf8_decode($_SESSION["user_fullname"]) . "\n"
                        . "Email: " . $_SESSION["user_email"] . "\n"
                        . "Mention in list?: " . (($_SESSION["mention_ok"]) ? "yes" : "no") . "\n";
                    $email->AddAddress(TO_EMAIL);

                    $file_to_attach = "./translations/".I18N_SLUG."_$selected_lang.json";
                    $email->AddAttachment($file_to_attach, I18N_SLUG."_$selected_lang.json");

                    $_SESSION["last_sent"] = time();
                    $email->Send();
                }
            } else {
                $error = "Can't save translation.";
                http_response_code(400);
            }
        }
    }
    ?>
    <?php if (empty($_SESSION) || empty($_SESSION["user_fullname"]) || !empty($_POST["change_profile"])): ?>
    <p>
        Before you can begin translating we need your contact information. Please fill in this form:
    </p>
    <div class="container">
        <form method="post">
            <div class="form-group">
                <label for="exampleInputEmail1">Full name</label>
                <input type="text" class="form-control" id="fullname" name="fullname" value="<?php
                echo $fullname;
                ?>" aria-describedby="fullnameHelp"
                       placeholder="Enter your full name">
            </div>
            <div class="form-group">
                <label for="exampleInputEmail1">Email address</label>
                <input type="email" name="email" class="form-control" id="email" value="<?php
                echo $email;
                ?>"
                       aria-describedby="emailHelp"
                       placeholder="Enter email">
                <small id="emailHelp" class="form-text text-muted">We'll never share your email with anyone else.
                </small>
            </div>
            <div class="form-group">
                <div class="switch">
                    <label>
                        <input type="checkbox" id="mention_ok" name="mention_ok" <?php echo $mention_ok; ?>>
                        Add my name to the official list of translators
                    </label>
                </div>
            </div>
            <button type="submit" class="btn btn-primary" id="submit" disabled>Begin Translation</button>
        </form>
    </div>
</div><!-- /.container -->
    <script>
      $(document).ready(
        function () {
          $("#fullname").keyup(validateInputs);
          $("#fullname").change(validateInputs);
          $("#email").change(validateInputs);
          $("#email").keyup(validateInputs);
        }
      );

      function validateInputs() {
        var fullname = $("#fullname").val();
        var email = $("#email").val();

        console.log(fullname);
        console.log(email);
        if (fullname !== "" && email !== "" && email.indexOf("@") > -1) {
          $("#submit").removeAttr("disabled");
        } else {
          $("#submit").attr("disabled", "disabled");
        }
      }

      // validate after start
      validateInputs();
    </script>
<?php endif; ?>
<?php if (!empty($error)): ?>
    <div class="alert alert-danger">
        <?php echo $error; ?>
    </div>
<?php endif; ?>
<?php if (empty($error) && !empty($_SESSION) && empty($_POST["change_profile"]) && !empty($_SESSION["user_fullname"])): ?>

    <table style="width:100%;">
        <tbody>
        <tr style="padding:3px;height:30px;">
            <td style="background-color: lightgray;vertical-align: middle; text-align: center;padding:3px;height:30px;">
                <?php echo $_SESSION["user_fullname"]; ?>
            </td>
            <td style="background-color: lightgray;vertical-align: middle; text-align: center;padding:3px;height:30px;">
                <?php echo $_SESSION["user_email"]; ?>
            </td>
            <td style="background-color: lightgray;vertical-align: middle; text-align: center;padding:3px;height:30px;">
                <form method="post">
                    <input hidden type="checkbox" name="change_profile" value="change" checked/>
                    <button class="btn btn-info" type="submit" style="margin-top:20px; padding: 0px;">Change profile
                    </button>
                </form>
            </td>
        </tr>
        </tbody>
    </table>
    <br/><br/>

    <p style="text-align: center;">
        <span style="margin-left:20px;font-size:20px; font-weight:bold;">I want translate <?php echo APP_NAME; ?> to </span>
    <div style="text-align:center;margin-top:-20px;" class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" style="margin-top:5px;" type="button" id="lang-selection"
                data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
            <?php echo $LANGUAGE_LABELS[$selected_lang]; ?>
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <?php
            $files = scandir("./translations");
            foreach ($languages as $language):

                if ($language !== "en" && isset($LANGUAGE_LABELS[$language])):
                    $selected = "";
                    if ($selected_lang == $language) {
                        $selected = "selected";
                    }
                    ?>
                    <a class="dropdown-item"
                       href="?lang=<?php echo $language; ?>"><?php echo $LANGUAGE_LABELS[$language]; ?></a>
                <?php endif;
            endforeach; ?>
        </div>
    </div>
    </p>
    <div class="card" style="padding:10px;margin-bottom:20px;">
        <p>
            <b>Quick instructions:</b>
        <ul>
            <li><b>Fill in the first column on the right side with the name of target language in its language (e.g.
                    "Deutsch" for German, "English" for English etc.).</b></li>
            <li>Fill in the right side of the other lines or check if the translation is correct. Empty translations are
                marked with a red border on the right side.
            </li>
            <li>Please keep words in double braces and keep words in tags like "&lt;br&gt;".<br>
                Example 1: "Hello {{name}}" => "Hallo {{name}}"<br/>
                Example 2: "Hello &lt;br&gt;" => "Hallo &lt;br&gt;"<br/>
            </li>
            <li>
                If you finished your work click on "SAVE". If your translation is good, we will use it in <?php echo APP_NAME; ?>.
            </li>
            <li>If you checked "Add my name to the official list of translators" your name will be mentioned. Otherwise
                your work is anonymous.
            </li>
            <li>If you have any questions or if you miss a language contact us: <a
                        href="mailto:<?php echo TO_EMAIL; ?>"><?php echo TO_EMAIL; ?></a></li>
        </ul>
        </p>
        <p style="text-align: center;">
            <i>Do you know somebody who could translate <?php echo APP_NAME; ?> to a further language? Tell him/her about it. We are
                looking forward to his/her e-mail :)</i>
        </p>
        <blockquote class="blockquote text-center">
            <p class="mb-0">Alone we can do so little, together we can do so much.</p>
            <footer class="blockquote-footer">Hellen Keller</footer>
        </blockquote>

    </div>

    <div class="container">
        <button class="btn btn-raised btn-primary" style="width: 100%;" onclick="sendResult()">SAVE</button>
        <?php
        $table = new TranslationTable(new LanguagePackage("en", $LANGUAGE_LABELS["en"], I18N_SLUG."_en.json"),
            new LanguagePackage($selected_lang, $LANGUAGE_LABELS[$selected_lang], I18N_SLUG."_$selected_lang.json"),
            false
        );
        $table->output();
        ?>

        <form id="sendResult" method="post">
            <textarea id="result" class="form-control" style="display:none" name="json"></textarea>
            <button class="btn btn-raised btn-primary" style="width: 100%;">SAVE</button>
        </form>
    </div>
    <script>
      var json = {};

      $(document).ready(function () {
        $(".lang2").keyup(function () {
          if ($(this).text() === "") {
            $(this).addClass("border-red");
          } else {
            $(this).removeClass("border-red");
          }

          json = {};

          $(".lang2").each(function (i, elem) {
            var path = $(elem).attr("data-path");
            var splitted = path.split(".");
            splitted = splitted.filter(function (t) {
              if (t !== null && t !== "") return t;
            });

            setProperty(json, splitted, $(elem).text());
            $("#result").text(JSON.stringify(json, null, 2));
          });
        });

        function setProperty(obj, path, value) {
          if (path.length > 1) {
            if (obj === undefined || obj === null) {
              obj = {};
            }

            if (!obj.hasOwnProperty(path[0])) {
              obj["" + path[0] + ""] = {};
            }

            setProperty(obj["" + path[0] + ""], path.slice(1), value);

          } else {
            obj["" + path[0]] = value;
          }
        }
      });

      function sendResult() {
        $("#sendResult").submit();
      }
    </script>
<?php endif; ?>
