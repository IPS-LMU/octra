/**
 * this is a test validation method to show how validation could work.
 * @param annotation
 * @returns {{start: number, length: number, code: string}}
 */
function validateAnnotation(annotation, guidelines) {
    var result = [];

    //R06 Satzzeichen
    var re = /[\(\.,\!\?;\)]/g;
    while ((match = re.exec(annotation)) != null) {
        result.push({
            start: match.index,
            length : match[0].length,
            code: "R06"
        });
    }

    //M01
    for(var i = 0; i < guidelines.markers.length; i++){
        var marker = guidelines.markers[i].code;

        re = new RegExp("("+ escapeRegex(marker) +")( *("+ escapeRegex(marker) +"))+", "g");
        while ((match = re.exec(annotation)) != null) {
            result.push({
                start: match.index,
                length : match[0].length,
                code: "M01"
            });
        }
    }

    //the next line has to be before returning the result
    result = sortValidationResult(result);
    return result;
}

/**
 * method that is called before annotation was saved
 * @param annotation
 * @param guidelines
 * @returns string
 */
function tidyUpAnnotation(annotation, guidelines) {
    var result = annotation;

    result = result.replace(/<[~^a-z0-9]+>/g, function (x) {
        return " " + x + " ";
    });
    //set whitespaces before *
    result = result.replace(/(\w|ä|ü|ö|ß|Ü|Ö|Ä)\*(\w|ä|ü|ö|ß|Ü|Ö|Ä)/g, "$1 *$2");
    //set whitespaces before and after **
    result = result.replace(/(\*\*)|(\s\*\*)|(\*\*\s)/g, " ** ");

    //replace all numbers of whitespaces to one
    result = result.replace(/\s+/g, " ");
    //replace whitespaces at start an end
    result = result.replace(/^\s+/g, "");
    result = result.replace(/\s$/g, "");
    return result;
}


/*
###### Default methods.
 */
function escapeRegex(regex_str) {
    //escape special chars in regex
    return regex_str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function sortValidationResult(result){
    return result.sort(function(a,b){
        if(a.start === b.start)
            return 0;
        if(a.start < b.start)
            return -1;
        if(a.start > b.start)
            return 1;
    });
}

console.log("ok es klappt test4");