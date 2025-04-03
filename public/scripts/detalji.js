document.addEventListener('DOMContentLoaded', function() {
    let nizPristupljenihUpita=new Array()
    let nizPristupljenihStranica=new Array()
    const nekretnina_id=1;
    let nekretnina;
    function postaviUpite(upiti){
        let nizTriUpita=document.getElementsByClassName('upit')
        for(let i=0;i<3;i++){
            if(upiti[i]){
            nizTriUpita[i].innerHTML=`
            <p><strong>Username ${i+1}:</strong> ${upiti[i].korisnik_id}</p>
            <p>${upiti[i].tekst_upita}</p>`
            nizPristupljenihUpita[i]=upiti[i]
        }}
    }
    function postaviNovuNekretninu(nekretnina){
        document.getElementById('nazivNekretnine').innerHTML+=` ${nekretnina.naziv}`
        document.getElementById('kvadraturaNekretnine').innerHTML+=` ${nekretnina.kvadratura} m²`
        document.getElementById('cijenaNekretnine').innerHTML+=` ${nekretnina.cijena} KM`
        document.getElementById('tip_grijanjaNekretnine').innerHTML+=` ${nekretnina.tip_grijanja} `
        document.getElementById('lokacijaNekretnine').innerHTML+=` ${nekretnina.lokacija}  `
        document.getElementById('godina_izgradnjeNekretnine').innerHTML+=` ${nekretnina.godina_izgradnje} `
        document.getElementById('datum_objaveNekretnine').innerHTML+=` ${nekretnina.datum_objave} `
        document.getElementById('opisNekretnine').innerHTML+=` ${nekretnina.opis} `
        nizPristupljenihStranica[0]=true
        postaviUpite(nekretnina.upiti)
        }
    PoziviAjax.getNekretnina(nekretnina_id, async (error, data) => {
            if(error){
                window.alert(error)
            }else{
                nekretnina=await data
                postaviNovuNekretninu(nekretnina)
            }
        }
    )
    function pristupUpitima(page){
        for(let i=0;i<nizPristupljenihStranica.length;i++)
            if(page===nizPristupljenihStranica[i])
                return false
        return true
    }
    function spremiUpite(upiti){
        for(let i=0;i<upiti.length;i++)
            if(upiti[i])
                nizPristupljenihUpita.push(upiti[i])
    }
    function promjenaUpitaNaEkranu(nekretnina_id, page){
        if(pristupUpitima(page)){
        PoziviAjax.getNextUpiti(nekretnina_id,page,async (error,data)=>{
            if(error){
                window.alert(error)
            }else{
                let upiti=await data
                spremiUpite(upiti)
                postaviUpite(upiti)
                nizPristupljenihStranica[page]=true
            }
        })}else{
            let upiti
            if(page===0){
                upiti=nekretnina.upiti.slice(-3)
              }else {
                page++
                upiti = nekretnina.upiti.slice(-3*page,-3*page+3);
                }
            postaviUpite(upiti)
        }}
        let page=0
        const promjenaupita=() => {
            function fnLijevo(){
                page=page+1
                promjenaUpitaNaEkranu(nekretnina_id,page)
            }
            function fnDesno(){
                page=page-1
                promjenaUpitaNaEkranu(nekretnina_id,page)
            }
            function resetGl(){
                let nizTriUpita=document.getElementsByClassName('upit')
                for(let i=0;i<3;i++){
                    if(upiti[i])
                    nizTriUpita[i].innerHTML=``
                }
            }
            return {
                lijevo:fnLijevo,
                desno:fnDesno,
                resetGl:resetGl
            }
        }
        document.querySelector('#prethodni').addEventListener('click',promjenaupita().lijevo);
        document.querySelector('#sljedeci').addEventListener('click', promjenaupita().desno);

        const lokacija=document.getElementById("lokacijaNekretnine");
        function postaviNekretnine(nekretnine){
            let naziviNekretnina=document.getElementsByClassName('nazivNekretnine')
            let kvadraturaNekretnine=document.getElementsByClassName('kvadraturaNekretnine')
            let cijenaNekretnine=document.getElementsByClassName('cijenaNekretnine')
            for(let i=0;i<5;i++){
                naziviNekretnina[i].innerHTML+=` ${nekretnine[i].naziv}`
                kvadraturaNekretnine[i].innerHTML+=` ${nekretnine[i].kvadratura}`
                cijenaNekretnine[i].innerHTML+=` ${nekretnine[i].cijena}`
            }
        }
        function ocistiNekretnine(){
            let naziviNekretnina=document.getElementsByClassName('nazivNekretnine')
            let kvadraturaNekretnine=document.getElementsByClassName('kvadraturaNekretnine')
            let cijenaNekretnine=document.getElementsByClassName('cijenaNekretnine')
            for(let i=0;i<5;i++){
                naziviNekretnina.innerHTML+=``
                kvadraturaNekretnine.innerHTML+=``
                cijenaNekretnine.innerHTML+=``
            }
        }
        if (lokacija) {
            lokacija.addEventListener("click", (event) => {
            event.preventDefault();
            let top5nekretnina
            PoziviAjax.getTop5Nekretnina(nekretnina.lokacija, async (err,data)=>{
                if(err != null){
                    window.alert(err)
                }else{
                    top5nekretnina=await data
                    ocistiNekretnine()
                    postaviNekretnine(top5nekretnina)
                }
            })})}
    });
