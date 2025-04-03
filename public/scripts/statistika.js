
window.onload = function(){

    let statistika = StatistikaNekretnina()
    statistika.init(listaNekretnina, listaKorisnika)


    let period = []
    let rasponeCijena = []
    let brUnosa=0
    let provjera = 0
    let grapharea = document.getElementById('can')
    let chart  



    document.getElementById("izracunaj-kvadratura").addEventListener("click", () => {
        const kriterij = JSON.parse(document.getElementById("kriterij-kvadratura").value);
        const rezultat = statistika.prosjecnaKvadratura(kriterij);
        document.getElementById("rezultat-kvadratura").textContent = `Prosječna kvadratura: ${rezultat}`;
    });

    document.getElementById("pronadji-outlier").addEventListener("click", () => {
        const kriterij = JSON.parse(document.getElementById("kriterij-outlier").value);
        const nazivSvojstva = document.getElementById("naziv-svojstva").value;
        const rezultat = statistika.outlier(kriterij, nazivSvojstva);
        if (rezultat) {
            document.getElementById("rezultat-outlier").textContent = `Outlier: ${JSON.stringify(rezultat)}`;
        } else {
            document.getElementById("rezultat-outlier").textContent = "Nema rezultata za zadani kriterij.";
        }
    });

    document.getElementById("moje-nekretnine").addEventListener("click", () => {
        const korisnikId = parseInt(document.getElementById("korisnikId").value);
        const korisnik = { id: korisnikId };
        
        const nekretnine = statistika.mojeNekretnine(korisnik);

        const lista = document.getElementById("lista-moje-nekretnine");
        lista.innerHTML = ""; 

        if (!nekretnine || nekretnine.length === 0) {
            const poruka = document.createElement("p");
            poruka.textContent = "Korisnik s ovim ID-em ne postoji ili nema nekretnina.";
            lista.appendChild(poruka);
        } else {
            nekretnine.forEach(nekretnina => {
                const li = document.createElement("li");
                li.textContent = `${nekretnina.naziv} (${nekretnina.lokacija}) - ${nekretnina.upiti.length} upita`;
                lista.appendChild(li);
            });
        }
    });



    function iscrtajHistogram(period,rasponeCijena,histogram) {


        //console.log(rasponeCijena)
        //console.log(period)
        //console.log(histogram)

        let labelCijena = []
        for (let j= 0; j < rasponeCijena.length; j++){
            labelCijena[j]="od: "+ rasponeCijena[j].od +", do: "+rasponeCijena[j].do
        }

        let labelPeriod = []
        for (let j= 0; j < period.length; j++){
            labelPeriod[j]="od: "+ period[j].od +", do: "+period[j].do
        }

        //setup

        let data1=[]
        let indexHis=0;
        for (let i= 0; i < period.length; i++) {
            data1[i]=[]
            for (let j= 0; j < rasponeCijena.length; j++) {
                data1[i][j]=histogram[indexHis].brojNekretnina;
                indexHis++;
            }
        }


        let graphData=[]

        graphData[0] = {
            label: labelPeriod[0],
            data: data1[0],
        };

        graphData[1] = {
            label: labelPeriod[1],
            data: data1[1],
        };

        graphData[2] = {
            label: labelPeriod[2],
            data: data1[2],
        };

        graphData[3] = {
            label: labelPeriod[3],
            data: data1[3],
        };

        graphData[4] = {
            label: labelPeriod[4],
            data: data1[4],
        };


        console.log(graphData)

        let data = {
            labels: labelCijena,
            datasets: [
            ]
        }  
        switch (period.length) {
            case 1:
                data = {
                    labels: labelCijena,
                    datasets: [
                    graphData[0],
                    ]
                }  
            break;
            case 2:
                data = {
                    labels: labelCijena,
                    datasets: [
                    graphData[0],
                    graphData[1],
                    ]
                }  
                break;
            case 3:
                data = {
                    labels: labelCijena,
                    datasets: [
                    graphData[0],
                    graphData[1],
                    graphData[2],
                    ]
                }  
            break;
            case 4:
                data = {
                    labels: labelCijena,
                    datasets: [
                    graphData[0],
                    graphData[1],
                    graphData[2],
                    graphData[3],
                    ]
                }  
                break;
                case 5:
                    data = {
                        labels: labelCijena,
                        datasets: [
                            graphData[0],
                            graphData[1],
                            graphData[2],
                            graphData[3],
                            graphData[4],
                        ]
                    }  
                    break;
            default:
                break;
        }


    // {label: period[0],data: data1[0],},{label: period[1],data: data1[1],}

        //config
        const config = {
            type: 'bar',
            data,
            options: {
            scales: {
                y: {
                beginAtZero: true
                }
            }
            }
        }

        
        //render init block
        if(provjera==1){
            chart.destroy()
        }
        chart= new Chart(
            grapharea,
            config
        );
        provjera = 1

            
    }


    let numOfButtonPreses=0

    document.getElementById('iscrtaj-dugme').addEventListener('click', function () {
        numOfButtonPreses++
        if(numOfButtonPreses>5){
            alert("maksimum histografa iscrtano, ponovo ucitajte stranicu")
        }else{
        const pocetniDatum = document.getElementById('pocetni-datum').value;
        const krajnjiDatum = document.getElementById('krajnji-datum').value;
        const minCijena = parseFloat(document.getElementById('min-cijena').value);
        const maxCijena = parseFloat(document.getElementById('max-cijena').value);

        if (!pocetniDatum || !krajnjiDatum || isNaN(minCijena) || isNaN(maxCijena)) {
            alert("Unesite ispravne podatke!");
            return;
        }
        period[brUnosa]={od:pocetniDatum ,do: krajnjiDatum }
        rasponeCijena[brUnosa]={od: minCijena ,do: maxCijena }
        brUnosa++;

        
        histogram = statistika.histogramCijena(period,rasponeCijena)
        iscrtajHistogram(period,rasponeCijena,histogram);
   }
    });


    }

