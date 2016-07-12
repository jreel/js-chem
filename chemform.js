/**
 * chemform.js
 * v1.0 created by jreel on 7/11/2016
 *
 * Input: ASCII string
 * Output: nicely, properly-HTML-formatted chemical formula
 *
 * Includes a demo HTML file to illustrate auto-parsing of all text on the page
 *
 * How it works:
 *   For each input string, a hashtable of patterns (regex) and format templates is searched for matches, and
 *   the strindex of all matches are stored in an array. (The hashtable is thus sorted from least to most specific.)
 *   After matches are collected, the match at the head of the string (matches[0]) is applied, the captured text
 *   is formatted and appended to the output string, and sliced off the front of the input string. The process
 *   continues until the entire input string has been processed (input.length = 0).
 *
 * Formatting rules:
 *   Unfortunately due to the lack of regex "lookbehind" functionality in JavaScript, the input ASCII must follow
 *   certain rules.
 *
 *   Coefficients in chemical formulae or equations must always be preceded by whitespace.
 *   Superscripted charges must either immediately follow a closing square bracket, e.g. [NO3]-
 *    or be encased in parentheses, e.g. CO3(2-)
 *   Subscripts are taken to be any digit not followed by a + or -. Note that the rule for coefficients overrides the
 *    rule for subscripts, so a number preceded by whitespace will match as a coefficient, not a subscript.
 *
 *   Two arrow types are implemented, a right arrow (&rarrow;) and an equilibrium arrow (&rlhar;).
 *   These can be constructed as -----> (right arrow) and <---> or <====> (equilibrium arrow), with any number of
 *    hyphens or equals signs used. They must be surrounded by whitespace.
 *
 *   Other chemical equation notation is implemented. A "reaction plus" is simply + surrounded by whitespace.
 *   Phase notations (aq), (g), (l), (s) are included as well.
 *
 * Other approaches:
 *   Github user porglezomp uses a finite state machine (https://github.com/porglezomp/chemset.js)
 *
 * To-do:
 *   There are many possibilities for expansion. One way to increase specificity while making the input ASCII simpler
 *    would be to use a FSM (see above), or to implement a custom function that mimics regex "lookbehind" functionality.
 *    Also, it may be useful to validate 'element' matches against a list of atomic symbols (particularly if custom CSS
 *    is to be used).
 *
 */

var chemformpatterns = {

    'whitespace': {                                  // 1 or more whitespace characters
        regex: /(\s+)/,
        format: '$1'
    },
    'normalword': {                                 // essentially a "catch all", overridden by any later matches
        regex: /\b(\w+)\b/,
        format: '$1'
    },
    'htmltag' : {                                   // we don't want to muck with existing html
        regex: /(<\/?[A-Za-z]+[^>]*>)/,
        format: '$1'
    },
    'closebracket': {                               // ) or ]. Probably not necessary
        regex: /([\]\)])/,                          //  but could be useful for future custom formatting
        format: '$1'
    },
    'openbracket': {                                // [ or ( NOT followed by phase or charge notations
        regex: /([\[\(])(?!(?:[a-z]|0|[1-9]*[\+\-]))/,
        format: '$1'
    },
    'phase': {                                      // phase notation, ex (g), (s), (l), (aq)
        regex: /\((aq|l|s|g)\)/,
        format: '<small><em>&nbsp;($1)&nbsp;</em></small>'
    },
    'reactionplus': {                               // simply a plus sign surrounded by whitespace
        regex: /\+/,
        format: '&nbsp;&plus;&nbsp;'
    },
    'equilibrium': {                                // < followed by hyphens or equals followed by >
        regex: /(?:<|&lt;)(\-|=)+(?:>|&gt;)/,       // ex: <--> <=======> <=> <->
        format: '&nbsp;&rlhar;&nbsp;'
    },
    'arrow': {                                      // 1 or more hyphens followed by >
        regex: /\-+(?:>|&gt;)/,                     // ex: --> ------------> ---> ->
        format: '&nbsp;&rarr;&nbsp;'
    },

    // note: 'minus' charges are checked for separately so the format can use an actual minus sign,
    // which looks much nicer than a hyphen

    'bracketedchargeminus': {                       // 0+ digits followed by -, enclosed in brackets
        regex: /[\(\[]([1-9]*)[\-][\)\]]/,
        format: '<sup>$1&minus;</sup>'
    },
    'bracketedcharge': {
        regex: /[\(\[](0|[1-9]*[\+])[\)\]]/,        // a lone zero or 0+ digits followed by +, enclosed in brackets
        format: '<sup>$1</sup>'
    },
    'closebracketwithchargeminus': {                // a closing square bracket followed by 0+ digits followed by -
        regex: /\]([1-9]*)[\-]/,                    // ex: [NaNO3]-
        format: ']<sup>$1&minus;</sup>'
    },
    'closebracketwithcharge': {                     // a closing square bracket followed by 0+ digits followed by +
        regex: /\]([1-9]*[\+])/,                    // ex: [NH4]+
        format: ']<sup>$1</sup>'
    },
    'subscript': {                                  // digits NOT followed by +/-
        regex: /([1-9][0-9]*)(?![\+\-])/,           // ex: H2SO4
        format: '<sub>$1</sub>'
    },
    'coefficient': {                                // digits (optional decimal) NOT followed by +/-;
        regex: /(\s+[0-9]+[,\.]?[0-9]*)(?![\+\-])/,  // must have leading whitespace
        format: '$1'
    },
    'element': {                                    // uppercase followed by 0-1 (and no more) lowercase
        regex: /([A-Z][a-z]?)(?![a-z])/,
        format: '$1'
    },
    'rsnotation': {                                 // ex: (2R,3S)-1,2,3-butanetriol
        regex: /(\((?:\d+(?:R|S),?)+\))/,
        format: '<em>$1</em>'
    },

    // some "band-aids" to help with breakage cases

    'numberpunctuation': {                          // ex: ranges 1-10, decimals 2.5, chem notation 2,3-dimethylbutane
        regex: /([0-9]+[,\.\-][0-9]+)/,             // to try to make sure 2nd number not treated as subscript
        format: '$1'
    }
};

function chemform(unformatted) {
    if (!unformatted || unformatted == "" || unformatted.length == 0) {
        return "";
    }
    if (unformatted.match(/^\s*$/)) {  // contains only whitespace
        return unformatted;
    }

    var formatted = "";     // the formatted formula to return
    unformatted = " " + unformatted.trim();  // add leading whitespace to pick up possible leading coefficient

    /****
     * loop through patterns table looking for a match
     * this loops thru the entire pattern list and stores strindex of any matches
     * and at the end, uses whichever one has the index 0 (beginning of the string)
     *
     * the idea here is to always parse from the very beginning of the string
     * and chop off the head as it is matched
     */

    var sanity = 10000;
    while (unformatted.length > 0 && sanity) {

        var pattern, format, foundindex, result, resultf;
        var matches = [];

        for (var p in chemformpatterns) {
            pattern = chemformpatterns[p].regex;
            foundindex = unformatted.search(pattern);
            if (foundindex > -1) {
                matches[foundindex] = chemformpatterns[p];
            }
        }

        // try to use matches[0] as the pattern (match the very beginning of the string)
        // if none, pass the first char of the string (whatever it is) thru unchanged
        if (matches[0]) {
            pattern = matches[0].regex;
            format = matches[0].format;
        }
        else {
            pattern = /(.)/;
            format = "$1";
        }

        // capture the match and format it
        result = unformatted.match(pattern)[0];
        resultf = result.replace(pattern, format);
        formatted += resultf;

        // remove the result from the original
        unformatted = unformatted.slice(result.length);


        sanity--;
    }

    return formatted;
}
