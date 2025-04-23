

<?php
include_once("./obj/functions.php");
/**
 * Created by PhpStorm.
 * User: uni
 * Date: 01.10.17
 * Time: 10:35
 */

class TranslationTable
{
    private $readonly = false;
    private $lang1 = null;
    private $lang2 = null;

    public function __construct($lang1, $lang2, $readonly = false)
    {
        $this->readonly = $readonly;

        if (file_exists("./translations/".I18N_SLUG."_en.json")) {
            $file_from = file_get_contents("./translations/" . $lang1->getFileName());
            $this->lang1 = new LanguagePackage($lang1->getCode(), $lang1->getLabel(), $lang1->getFileName(), filemtime("./translations/" . $lang1->getFileName()),
                json_decode($file_from, true));

            $file_to = file_get_contents("./translations/" . $lang2->getFileName());
            $json = json_decode($file_to, true);
            $this->lang2 = new LanguagePackage($lang2->getCode(), $lang2->getLabel(), $lang2->getFileName(), filemtime("./translations/" . $lang2->getFileName()),
               $json );
        }
    }

    public function output()
    {
        echo $this->__toString();
    }

    public function __toString()
    { ?>
        <table class="table table-striped table-bordered">
            <thead>
            <tr>
                <td class="half"><?php echo $this->lang1->getLabel(); ?></td>
                <td class="half"><?php echo $this->lang2->getLabel(); ?></td>
            </tr>
            </thead>
            <tbody>
            <?php echo $this->readJSON($this->lang1, $this->lang2); ?>
            </tbody>
        </table>
        <?php return "";
    }

    private function readJSON($lang_from, $lang_to, $path = "")
    {

        $result = "";

        $json = $lang_from->getJSON();
        $contenteditable = "";

        if (!$this->readonly) {
            $contenteditable = "contenteditable='true'";
        }

        if (!empty($json)) {

            foreach ($json as $key => $value) {
                if (!is_string($value)) {
                    $toValue = (empty($lang_to->getJSON()[$key])) ? null : $lang_to->getJSON()[$key];
                    $result .= $this->readJSON(
                        new LanguagePackage($lang_from->getCode(), $lang_from->getLabel(), $lang_from->getFileName(), null, $value),
                        new LanguagePackage($lang_to->getCode(), $lang_to->getLabel(), $lang_to->getFileName(), null, $toValue),
                        ($path !== "") ? $path .".". $key : $key
                    );
                } else {
                    $value2 = "";
                    if (!empty($lang_to->getJSON()[$key])):
                        $value2 = $lang_to->getJSON()[$key];
                    endif;
                    $empty = "";
                    if ($value2 === "") {
                        $empty = "border-red";
                    }
                    $result .= "<tr><td class='half' data-path='$path." . $key . "'>" . htmlspecialchars($value) . "</td><td class='half $empty lang2' $contenteditable data-path='$path." . $key . "'>" . htmlspecialchars($value2) . "</td></tr>";
                }
            }

            return $result;
        } else {
            return "<tr><td colspan='2'>No entries found</td></tr>";
        }
    }
}

?>
