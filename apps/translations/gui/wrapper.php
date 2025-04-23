<body>
<nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
    <a class="navbar-brand" href="#">TranslationManager - <?php echo APP_NAME ?></a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault"
            aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarsExampleDefault">
        <ul class="navbar-nav mr-auto">
            <li class="nav-item <?php
            if($include_page === "start"){
                echo "active";
            }
            ?>">
                <a class="nav-link" href="start.php">Home <span class="sr-only">(current)</span></a>
            </li>
            <li class="nav-item <?php
            if($include_page === "translations"){
                echo "active";
            }
            ?>">
                <a class="nav-link" href="translations.php">Translations</a>
            </li>
            <li class="nav-item <?php
            if($include_page === "translation"){
                echo "active";
            }
            ?>">
                <a class="nav-link" href="translation.php">Start Translation</a>
            </li>
        </ul>
    </div>
</nav>
