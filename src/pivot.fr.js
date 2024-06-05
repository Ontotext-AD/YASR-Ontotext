(function() {
    var callWithJQuery;

    callWithJQuery = function(pivotModule) {
        if (typeof exports === "object" && typeof module === "object") {
            return pivotModule(require("jquery"));
        } else if (typeof define === "function" && define.amd) {
            return define(["jquery"], pivotModule);
        } else {
            return pivotModule(jQuery);
        }
    };

    callWithJQuery(function($) {
        var frFmt, frFmtInt, frFmtPct, nf, tpl;
        nf = $.pivotUtilities.numberFormat;
        tpl = $.pivotUtilities.aggregatorTemplates;
        frFmt = nf({
            thousandsSep: " ",
            decimalSep: ","
        });
        frFmtInt = nf({
            digitsAfterDecimal: 0,
            thousandsSep: " ",
            decimalSep: ","
        });
        frFmtPct = nf({
            digitsAfterDecimal: 1,
            scaler: 100,
            suffix: "%",
            thousandsSep: " ",
            decimalSep: ","
        });
        return $.pivotUtilities.locales.fr = {
            localeStrings: {
                renderError: "Une erreur est survenue en dessinant le tableau crois&eacute;.",
                computeError: "Une erreur est survenue en calculant le tableau crois&eacute;.",
                uiRenderError: "Une erreur est survenue en dessinant l'interface du tableau crois&eacute; dynamique.",
                selectAll: "S&eacute;lectionner tout",
                selectNone: "S&eacute;lectionner rien",
                tooMany: "(trop de valeurs &agrave; afficher)",
                filterResults: "Filtrer les valeurs",
                totals: "Totaux",
                vs: "sur",
                by: "par"
            },
            aggregators: {
                "Compte": tpl.count(frFmtInt),
                "Compte des valeurs uniques": tpl.countUnique(frFmtInt),
                "Liste des valeurs uniques": tpl.listUnique(", "),
                "Somme": tpl.sum(frFmt),
                "Somme des entiers": tpl.sum(frFmtInt),
                "Moyenne": tpl.average(frFmt),
                "Minimum": tpl.min(frFmt),
                "Maximum": tpl.max(frFmt),
                "Ratio de sommes": tpl.sumOverSum(frFmt),
                "Limite sup&eacute;rieure 80%": tpl.sumOverSumBound80(true, frFmt),
                "Limite inf&eacute;rieure 80%": tpl.sumOverSumBound80(false, frFmt),
                "Somme comme fraction du total": tpl.fractionOf(tpl.sum(), "total", frFmtPct),
                "Somme comme fraction de lignes": tpl.fractionOf(tpl.sum(), "row", frFmtPct),
                "Somme comme fraction de colonnes": tpl.fractionOf(tpl.sum(), "col", frFmtPct),
                "Compte comme fraction du total": tpl.fractionOf(tpl.count(), "total", frFmtPct),
                "Compte comme fraction de lignes": tpl.fractionOf(tpl.count(), "row", frFmtPct),
                "Compte comme fraction de colonnes": tpl.fractionOf(tpl.count(), "col", frFmtPct)
            },
            renderers: {
                "Tableau": $.pivotUtilities.renderers["Table"],
                "Tableau &agrave; barres": $.pivotUtilities.renderers["Table Barchart"],
                "Carte de chaleur": $.pivotUtilities.renderers["Heatmap"],
                "Carte de chaleur par ligne": $.pivotUtilities.renderers["Row Heatmap"],
                "Carte de chaleur par colonne": $.pivotUtilities.renderers["Col Heatmap"],
                "Graphique lin&eacute;aire": $.pivotUtilities.renderers["Line Chart"],
                "Graphique &agrave; barres": $.pivotUtilities.renderers["Bar Chart"],
                "Graphique &agrave; barres empil&eacute;es": $.pivotUtilities.renderers["Stacked Bar Chart"],
                "Graphique en aires": $.pivotUtilities.renderers["Area Chart"],
                "Nuage de points": $.pivotUtilities.renderers["Scatter Chart"]
            }
        };
    });

}).call(this);
