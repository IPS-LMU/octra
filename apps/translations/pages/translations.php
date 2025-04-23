<?php
require_once("./obj/LanguagePackage.php");
require_once("./obj/translation_table.php");
include_once("./obj/functions.php");

$selected_lang = $_SESSION["selected_lang"];
?>


<div class="container">
    <h2>Available Translations</h2>
    <div class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" type="button" id="lang-selection" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
            <?php echo $LANGUAGE_LABELS[$selected_lang]; ?>
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <?php
            $files = scandir("./translations");
            foreach ($languages as $language):

                if ($language !== "en" && $language !== "en_org" && isset($LANGUAGE_LABELS[$language])):
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
    <div class="container">
        <?php
        $table = new TranslationTable(new LanguagePackage("en", $LANGUAGE_LABELS["en"], I18N_SLUG."_en.json"),
            new LanguagePackage($selected_lang, $LANGUAGE_LABELS[$selected_lang], I18N_SLUG."_$selected_lang.json"),
            true
        );
        $table->output();
        ?>
    </div>
</div><!-- /.container -->
