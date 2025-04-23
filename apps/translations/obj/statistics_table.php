<?php
include_once("./obj/functions.php");
require_once("./obj/LanguagePackage.php");
global $LANGUAGE_LABELS;

/**
 * Created by PhpStorm.
 * User: uni
 * Date: 01.10.17
 * Time: 10:35
 */
class StatisticsTable
{
    public $languages = array();
    public $langFrom;

    public function __construct()
    {
        global $LANGUAGE_LABELS;
        foreach ($LANGUAGE_LABELS as $key => $value) {
            if (file_exists("./translations/".I18N_SLUG."_$key.json")) {
                $file_from = file_get_contents("./translations/".I18N_SLUG."_$key.json");
                $langPackage = new LanguagePackage($key, $value, I18N_SLUG."_$key.json", filemtime("./translations/".I18N_SLUG."_$key.json"),
                    json_decode($file_from, true));

                if ($key === "en") {
                    $this->langFrom = $langPackage;
                } else {
                    $this->languages[$key] = $langPackage;
                }
            }
        }
    }

    public function output()
    {
        echo $this->__toString();
    }

    public function countItems($lang_from, $lang_to, $path = "")
    {
        $result = array("missing" => 0, "total" => 0, "code" => $lang_to->getCode());

        $json = $lang_from->getJSON();

        if (!empty($json)) {
            foreach ($json as $key => $value) {
                if (!is_string($value)) {
                    $toValue = (empty($lang_to->getJSON()[$key])) ? null : $lang_to->getJSON()[$key];
                    $newResult = $this->countItems(
                        new LanguagePackage($lang_from->getCode(), $lang_from->getLabel(), $lang_from->getFileName(), null, $value),
                        new LanguagePackage($lang_to->getCode(), $lang_to->getLabel(), $lang_to->getFileName(), null,  $toValue),
                        ($path !== "") ? $path . "." . $key : $key
                    );
                    $result["missing"] = $result["missing"] + $newResult["missing"];
                    $result["total"] = $result["total"] + $newResult["total"];
                } else {
                    if (empty($lang_to->getJSON()[$key])) {
                        $result["missing"]++;
                    }
                    $result["total"]++;
                }
            }
        }
        return $result;
    }

    public function getOverAllStatistics()
    {
        $result = array();
        foreach ($this->languages as $language) {
            $result[] = array_merge($this->countItems($this->langFrom, $language), array("language" => $language->getLabel()), array("change_date" => $language->getChangeDate()));
        }
        usort($result, function ($a, $b) {
            if ($a["missing"] > $b["missing"]) {
                return 1;
            } else if ($a["missing"] < $b["missing"]) {
                return -1;
            }
            return 0;
        });
        return $result;
    }

    public function __toString()
    {
        $statistics = $this->getOverAllStatistics();
        $statistics = array_merge(array(array("language" => "English", "missing" => 0, "total" => $statistics[0]["total"], "change_date" => filemtime("./translations/".I18N_SLUG."_en.json"))), $statistics);
        ?>
        <div class="mx-auto mt-5" style="max-width:700px;">
            <h2 style="text-align: center;">Overall translations</h2>
            <table class="table table-striped table-bordered">
                <thead>
                <tr>
                    <th style="text-align: center;">Language</th>
                    <th style="text-align: center;">Progress</th>
                    <th style="text-align: center;"># missing</th>
                    <th style="text-align: center;">Last change</th>
                </tr>
                </thead>
                <tbody>
                <?php
                foreach ($statistics as $statistic) {
                    $progess = floor((($statistic["total"] - $statistic["missing"]) / $statistic["total"]) * 100);
                    ?>
                    <tr>
                        <td class="language" style="width:120px;vertical-align:middle;">
                        <?php if($statistic["language"] !== "English") { ?>
                        <a href="translation.php?lang=<?php echo $statistic["code"] ?>"><?php echo $statistic["language"] ?></a>
                            <?php } else { ?>
                                <?php echo $statistic["language"] ?>
                                <?php } ?>
                    </td>
                        <td style="width: 250px;vertical-align:middle;">
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar bg-success" role="progressbar"
                                     style="width: <?php echo $progess ?>%;"
                                     aria-valuenow="<?php echo $progess ?>" aria-valuemin="0" aria-valuemax="100">
                                    <?php
                                    if ($progess >= 10) {
                                        echo $progess . " %";
                                    } ?>
                                </div>
                            </div>
                        </td>
                        <td class="missing"
                            style="width:100px;text-align: center;vertical-align:middle;"><?php echo $statistic["missing"]; ?></td>
                        <td style="max-width:150px;text-align: center;">
                            <?php echo date("Y-m-d H:i:s T", $statistic["change_date"]); ?>
                        </td>
                    </tr>
                <?php } ?>
                </tbody>
            </table>
        </div>
        <?php return "";
    }
}

?>
