/**
 * this is a test validation method to show how validation could work.
 * @param annotation
 * @returns {{start: number, length: number, code: string}}
 */
function validateAnnotation(annotation, guidelines) {
    let result = [];

    //Z01 Satzzeichen
    let re = /[\(\.,\!\?;\-\)]/g;
    while ((match = re.exec(annotation)) != null) {
        result.push({
            start: match.index,
            length : match[0].length,
            code: "Z01"
        });
    }

    //G01
    for(let i = 0; i < guidelines.markers.length; i++){
        let marker = guidelines.markers[i].code;

        re = new RegExp("("+ escapeRegex(marker) +")( *("+ escapeRegex(marker) +"))+", "g");
        while ((match = re.exec(annotation)) != null) {
            result.push({
                start: match.index,
                length : match[0].length,
                code: "G01"
            });
        }
    }

    //R02 Ziffern
    re = /[0-9]+/g;
    while ((match = re.exec(annotation)) != null) {
        result.push({
            start: match.index,
            length : match[0].length,
            code: "R02"
        });
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
    let result = annotation;

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
        if(a.start == b.start)
            return 0;
        if(a.start < b.start)
            return -1;
        if(a.start > b.start)
            return 1;
    });
}