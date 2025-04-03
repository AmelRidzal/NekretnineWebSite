window.onload =function(){
    var upiti = document.getElementById("upiti");
    function ispisiUpit(MojiUpiti){
        for(let i=0;i<MojiUpiti.length;i++){
            
        upiti.innerHTML += `<div class="upit">Id nekretnine: <strong>${MojiUpiti[i].id_nekretnine}</strong> `
                        +`Upit nekretnine: ${Object.values(MojiUpiti[i].tekst_upita).join("")} <br /></div>`
    }
}
    function ispisiUpite(){
        PoziviAjax.getMojiUpiti((err,data)=>{
            if(err){
                window.alert(err)
            }else{
                let mojiUpiti=data
                ispisiUpit(mojiUpiti)
                }})
    }
    ispisiUpite()
}
