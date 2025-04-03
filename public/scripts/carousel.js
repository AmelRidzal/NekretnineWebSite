function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (!glavniElement || !sviElementi || sviElementi.length === 0 || indeks < 0 || indeks >= sviElementi.length) {
        return null;
    }

    function prikaziElement() {
        glavniElement.innerHTML =  "<div class=\"upit\">" + sviElementi[indeks].innerHTML + "</div>";
    }

    function fnLijevo() {
        indeks --;
        if(indeks<0)
            indeks=sviElementi.length-1;
        prikaziElement();
    }


    function fnDesno() {
        indeks ++;
        if(indeks>sviElementi.length-1)
            indeks=0;
        prikaziElement();
    }

    function resetGl(){
        glavniElement.innerHTML="";
        for (let i = 0; i < sviElementi.length; i++) {
            glavniElement.innerHTML +=  "<div class=\"upit\">" + sviElementi[i].innerHTML + "</div>";
            
        }
    }


    prikaziElement();

    return {
        fnLijevo: fnLijevo,
        fnDesno: fnDesno,
        resetGl: resetGl
    };
}
