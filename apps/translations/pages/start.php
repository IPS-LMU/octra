<div class="container">

    <div class="starter-template">
        <h1>Contribute as Translator for <?php echo APP_NAME; ?></h1>
        <p class="lead">Help us making  <?php echo APP_NAME; ?> multilingual: Translate the UI to your language!</p>
    </div>

    <div class="text-center">
    <h2>How to translate?</h2>
        <p class="card-body">
            This is easy. Just click on one of the languages listed below.
        </p>
    </div>

    <?php
    global $LANGUAGE_LABELS;
    require_once("./obj/statistics_table.php");
    $table = new StatisticsTable();
    $table->output()
    ?>
</div><!-- /.container -->
