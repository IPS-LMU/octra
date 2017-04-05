/**
 * this is a test validation method to show how validation could work.
 * @param annotation
 * @returns {{position: number, length: number, code: string}}
 */
function validateAnnotation(annotation) {

    let re = new RegExp(" +", "g");
    let result = [];

    while ((match = re.exec(annotation)) != null) {
        result.push({
            start: match.index,
            length : match[0].length,
            code: "M01"
        });
    }

    result = sortValidationResult(result);
    return result;
}

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