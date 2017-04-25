<?php

include_once('fpdf181/fpdf.php');

class GuidelinesPDF extends FPDF
{
    private $json;
    private $language;
    const DEFAULTFONT = "times";

    //sizes
    const HEADER_FONT_SIZE = 10;
    const FOOTER_FONT_SIZE = 8;
    const TITLE_FONT_SIZE = 18;
    const INFO_FONT_SIZE = 9;

    //margin
    const MARGIN_TOP = 15;
    const MARGIN_LEFT = 10;
    const MARGIN_RIGHT = 10;
    const MARGIN_BOTTOM = 15;

    //variables
    private $innerwidth = 0;

    //colors
    private $GRAY = array(100, 100, 100);
    private $LIGHTGRAY = array(220, 220, 220);
    private $BLACK = array(0, 0, 0);

    public function __construct($json, $language, $orientation = 'P', $unit = 'mm', $size = 'A4')
    {
        $this->json = $json;
        $this->language = $language;
        parent::__construct($orientation, $unit, $size);
        $this->init();
    }

    function init()
    {
        //variables
        $project = $this->json->meta->project;
        $this->SetMargins(self::MARGIN_LEFT, self::MARGIN_TOP, self::MARGIN_RIGHT);
        $this->innerwidth = $this->GetPageWidth() - self::MARGIN_LEFT - self::MARGIN_RIGHT;

        $this->addPage();
        $this->SetFont(self::DEFAULTFONT, 'U', self::TITLE_FONT_SIZE);

        $this->SetTitle($this->ud($this->language->guidelines . " $project"));
        $this->SetDrawColor(0, 0, 0);

        //Set title
        $this->SetY(self::MARGIN_TOP + 10);
        $this->MultiCell($this->innerwidth, 10, $this->ud($this->language->guidelines . " - $project"));
        //Set info
        $this->SetX(self::MARGIN_LEFT);
        $this->SetFont(self::DEFAULTFONT, '', self::INFO_FONT_SIZE);
        $this->changeTextColor($this->GRAY);
        $this->MultiCell($this->innerwidth, 5, $this->ud($this->language->authors . ": " . $this->json->meta->authors));
        $this->MultiCell($this->innerwidth, 5, $this->ud("Version: " . $this->json->meta->version));

        $this->SetAutoPageBreak(true, self::MARGIN_BOTTOM);
        //Begin output
        $this->SetY($this->GetY() + 5);
        $this->changeTextColor($this->BLACK);

        foreach ($this->json->instructions as $group) {
            //new group
            $this->SetFont(self::DEFAULTFONT, "U", 10);
            if (!empty($group->group)) {
                $this->changeFillColor($this->LIGHTGRAY);
                $this->SetFont(self::DEFAULTFONT, "B", 11);
                $this->MultiCell($this->innerwidth, 5, $this->ud($group->group), 1, 'L', true);
                $this->SetFont(self::DEFAULTFONT, "", 10);
            }

            $g = 0;
            foreach ($group->entries as $entry) {
                //new GROUP
                $tab = 15;
                $y = $this->GetY();
                //code
                $this->MultiCell($tab, 5, $this->ud($entry->code), 1);
                if ($this->GetY() < $y) {
                    //new page
                    $y = self::MARGIN_TOP;
                }

                $this->SetY($y);

                //set title
                $this->SetFont(self::DEFAULTFONT, "U", 10);
                $this->SetX($tab + self::MARGIN_LEFT);
                $this->MultiCell($this->innerwidth - $tab, 5, $this->ud($entry->title), 1);
                $this->SetFont(self::DEFAULTFONT, "", 10);
                $this->SetX($tab + self::MARGIN_LEFT);
                //set description
                $y = $this->GetY();
                $this->MultiCell($this->innerwidth - $tab, 5, $this->ud($entry->description), 1);
                $height = $this->GetY() - $y;
                //$this->SetY($y);
                //$this->MultiCell($tab, $height, "", 1);

                $col_width = ($this->innerwidth - $tab) / 3;

                $first_y = $this->GetY();
                $x = 0;
                $maxy = 0;
                $cell_heights = array();
                $e = 0;

                if (sizeof($entry->examples) > 0) {
                    $this->SetFont("helvetica", "", 8);
                    //NEW EXAMPLE
                    foreach ($entry->examples as $example) {
                        $y = $this->GetY();
                        $this->SetX($tab + self::MARGIN_LEFT + $x);
                        $this->MultiCell($col_width, 5, $example->annotation, 0, "L");
                        $x += $col_width;
                        $maxy = max($maxy, $this->GetY());

                        $cell_heights[$e] = $this->GetY() - $y;
                        if ($x >= $this->innerwidth - $tab) {
                            $x = 0;
                        } else {
                            $this->SetY($y);
                        }
                        $e++;
                    }
                    $last_y = $maxy;

                    //set borders
                    $this->SetY($first_y);
                    $maxcols = min(3, sizeof($entry->examples));
                    //echo $maxcols."<br/>";
                    $x = 0;
                    //$this->SetDrawColor(255, 0, 0);
                    $e = 0;


                    $e = 0;
                    $x = 0;
                    $this->SetY($first_y);

                    //adapt heights
                    for ($k = 0; $k < sizeof($entry->examples); $k++) {
                        $row = floor($k / 3);
                        $height = 0;
                        for ($l = $row * 3; $l < ($row + 1) * 3; $l++) {
                            $height = max($height, $cell_heights[$l]);
                        }
                        $cell_heights[$k] = $height;
                    }

                    $maxheight = 0;
                    for ($k = 0; $k < sizeof($entry->examples); $k++) {
                        //draw vertical line

                        //left border
                        $this->Line(self::MARGIN_LEFT + $tab + $x, $this->GetY(), self::MARGIN_LEFT + $tab + $x, $this->GetY() + $cell_heights[$k]);
                        //right border
                        $this->Line(self::MARGIN_LEFT + $tab + $x + $col_width, $this->GetY(), self::MARGIN_LEFT + $tab + $x + $col_width, $this->GetY() + $cell_heights[$k]);

                        //bottom border
                        //$this->SetDrawColor(0,0,255);
                        $this->Line(self::MARGIN_LEFT + $tab + $x, $this->GetY() + $cell_heights[$k], self::MARGIN_LEFT + $tab + $x + $col_width, $this->GetY() + $cell_heights[$k]);
                        //$this->SetDrawColor(255,0,0);

                        $x += $col_width;
                        /*
                        //draw bottom line
                        //bottom line
                        $new_y = $first_y;

                        for($a = 0; $a < ($e+1);$a++){
                            $new_y += $cell_heights[$a];
                        }

                        $this->SetDrawColor(0,0,255);
                        $this->Line(self::MARGIN_LEFT + $tab + $x, $this->GetY(), self::MARGIN_LEFT + $tab + $x, $this->GetY() + $cell_heights[$k])
                        $this->SetDrawColor(255,0,0);
    */

                        if ($x >= $this->innerwidth - $tab) {
                            $x = 0;
                            $e++;
                            $this->SetY($this->GetY() + $cell_heights[$k]);
                            $maxheight += $cell_heights[$k];
                        } else if ($k == sizeof($entry->examples) - 1) {
                            //last example
                            $maxheight += $cell_heights[$k];
                        }
                    }
                    $this->SetDrawColor(0, 0, 0);

                    //reset
                    $this->SetY($first_y + $maxheight);
                    //examples end
                }

                $this->SetY($this->GetY() + 3);
                //entry end
            }
            $this->SetFont(self::DEFAULTFONT, "", 10);
            $this->SetY($this->GetY() + 5);
            $g++;
        }
    }


    function Header()
    {
        $this->SetFont(self::DEFAULTFONT, "", self::HEADER_FONT_SIZE);
        $this->changeTextColor($this->GRAY);
        $this->SetY(self::MARGIN_TOP);
        $this->Cell(100, 5, $this->ud(""), 0, 0, 'L');
        $this->Cell($this->innerwidth - 100, 5, $this->ud("[" . $this->json->meta->date . " ] " . $this->json->meta->project), 0, 0, 'R');
        // Zeilenumbruch
        $this->Ln(20);
    }

    function Footer()
    {
        // Position 1,5 cm von unten
        $this->SetY(-self::MARGIN_BOTTOM);
        $this->SetFont(self::DEFAULTFONT, "", self::FOOTER_FONT_SIZE);
        $this->changeTextColor($this->GRAY);
        $page = $this->PageNo();
        $this->AliasNbPages();
        $this->Cell(0, 10, "$page/{nb}", 0, 0, 'C');
    }

    function changeTextColor($color)
    {
        $this->SetTextColor($color[0], $color[1], $color[2]);
    }

    function changeFillColor($color)
    {
        $this->SetFillColor($color[0], $color[1], $color[2]);
    }

    function ud($string)
    {
        return utf8_decode($string);
    }
}
