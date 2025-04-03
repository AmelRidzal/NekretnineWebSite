
let StatistikaNekretnina = function () {

    let spisak = SpisakNekretnina();


    let init = function (listaNekretnina, listaKorisnika) {
        spisak.init(listaNekretnina, listaKorisnika);
    };


    let prosjecnaKvadratura = function (kriterij) {
        const filtriraneNekretnine = spisak.filtrirajNekretnine(kriterij);
        if (filtriraneNekretnine.length === 0) return 0;

        const sumaKvadratura = filtriraneNekretnine.reduce((suma, nekretnina) => suma + nekretnina.kvadratura, 0);
        return sumaKvadratura / filtriraneNekretnine.length;
    };


    let outlier = function(kriterij, nazivSvojstva) {
        let filtriraneNekretnine = this.filtrirajNekretnine(kriterij);
        if (filtriraneNekretnine.length === 0) return null;

        let prosjecnaVrijednost = filtriraneNekretnine.reduce((sum, nekretnina) => sum + nekretnina[nazivSvojstva], 0) / filtriraneNekretnine.length;
        let najveceOdstupanje = filtriraneNekretnine.reduce((outlier, nekretnina) => {
            let odstupanje = Math.abs(nekretnina[nazivSvojstva] - prosjecnaVrijednost);
            return odstupanje > outlier.odstupanje ? { nekretnina, odstupanje } : outlier;
        }, { nekretnina: null, odstupanje: -Infinity });

        return najveceOdstupanje.nekretnina;
    };


    let mojeNekretnine = function (korisnik) {
        const nekretnineSaUpitima = spisak.listaNekretnina.filter(nekretnina =>
            nekretnina.upiti.some(upit => upit.korisnik_id === korisnik.id)
        );

        return nekretnineSaUpitima.sort((a, b) => b.upiti.length - a.upiti.length);
    };


    let histogramCijena = function (periodi, rasponiCijena) {
        let rezultat = [];

        periodi.forEach((period, indeksPerioda) => {
            let nekretnineUPeriodu = spisak.listaNekretnina.filter(nekretnina => {
                const godinaStr = nekretnina.datum_objave.slice(-5,-1)
                const godinaBr = parseInt(godinaStr)

                return godinaBr >= period.od && godinaBr <= period.do;
            });


            rasponiCijena.forEach((raspon, indeksRasponaCijena) => {
                let brojNekretnina = nekretnineUPeriodu.filter(nekretnina => {
                    return nekretnina.cijena >= raspon.od && nekretnina.cijena <= raspon.do;
                }).length;

                rezultat.push({
                    indeksPerioda,
                    indeksRasponaCijena,
                    brojNekretnina
                });
            });
        });

        return rezultat;
    };

    return {
        init: init,
        prosjecnaKvadratura: prosjecnaKvadratura,
        outlier: outlier,
        mojeNekretnine: mojeNekretnine,
        histogramCijena: histogramCijena
    };
};


