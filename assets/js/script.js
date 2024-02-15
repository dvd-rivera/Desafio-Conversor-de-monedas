const currencyToConvertHTML = document.getElementById("currencyToConvert")
const amountToConvertHTML = document.getElementById("amountToConvert")
const btnConvertHTML = document.getElementById("btnConvert")
const totalContainerHTML = document.getElementById("totalContainer")
// const ctx = document.getElementById('myChart').getContext('2d');

let currencies = []
let history = []
amountToConvertHTML.addEventListener("input", validateInput)
btnConvertHTML.addEventListener("click", convertCurrency)


function addCurrencies(Currencies) {
	Currencies.forEach(currency => {
		currencyToConvertHTML.innerHTML += `<option value="${currency.nombre}">${currency.nombre}</option>`
	});
}

currencyToConvertHTML.addEventListener('change', showChart)

function createArrCurrencies(coinsData) {
	let arrCurrencies = [];
	for (let key in coinsData) {
		if (	typeof coinsData[key] === 'object'
				&& coinsData[key] !== null 
				&& coinsData[key].codigo !== 'ipc'
				&& coinsData[key].codigo !== 'imacec'
				&& coinsData[key].codigo !== 'tpm'
				&& coinsData[key].codigo !== 'libra_cobre'
				&& coinsData[key].codigo !== 'libra_cobre'
				&& coinsData[key].codigo !== 'tasa_desempleo') {
			arrCurrencies.push(coinsData[key]);
		}
	}
	return arrCurrencies
}

async function fetchData() {
    try {
        let response = await fetch('https://mindicador.cl/api/');
        let data = await response.json();
		let arrCurrencies = createArrCurrencies(data)
		currencies = arrCurrencies
		console.log(currencies)
		addCurrencies(arrCurrencies)
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchData()

async function fetchHistoryData(currency) {
    try {
        let response = await fetch('https://mindicador.cl/api/' + currency);
        let data = await response.json();
		history = createArrHistory(data.serie)
    } catch (error) {
        console.error('Error:', error);
    }
}


function validateInput(){
	let value = amountToConvertHTML.value
	value = value.replace(/[^0-9.$, ]/g, '');
  
	if (value && value[0] !== '$') {
	  value = '$' + ' ' + value;
	}
  
	value = value.split('.').join('');
	value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

	amountToConvertHTML.value = value;
	btnConvertHTML.disabled = !amountToConvertHTML.value;
}


function convertCurrency(){
	let selected = currencies.filter((currency) => { return currency.nombre == currencyToConvertHTML.value})[0]
	let dolarValue = currencies.filter((currency) => { return currency.nombre == "Dólar observado"})[0]
	let formatedValue = amountToConvertHTML.value.split('.').join('').split('$').join('')
	let convertedValue = ''

	if (selected.unidad_medida == "Pesos") {
		convertedValue = parseInt(formatedValue) / selected.valor
	} else if (selected.unidad_medida == "Dólar") {
		let clpToDolar = formatedValue / dolarValue.valor
		convertedValue  = clpToDolar / selected.valor
	}

	showTotal(convertedValue, selected.codigo)
}

function showTotal(convertedValue, codigo) {
	let totalParts = convertedValue.toFixed(2).split(".")
	totalParts[1] = totalParts[1].replace(".",',')
	totalParts[0] = totalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
	let total = totalParts.join(',')

	if (codigo == 'uf'){
		total = 'UF ' + total
	} else if (codigo == 'ivp') {
		total = 'IVP ' + total
	} else if (codigo == 'dolar') {
		total = 'USD ' + total
	} else if (codigo == 'dolar_intercambio') {
		total = 'USD ' + total
	} else if (codigo == 'euro') {
		total = '€ ' + total
	} else if (codigo == 'utm') {
		total = 'UTM ' + total
	} else if (codigo == 'bitcoin') {
		total = '₿ ' + total
	}

	totalContainerHTML.innerHTML = `
	<p>CLP ${amountToConvertHTML.value } <span class="equivale">equivale a </span> ${total} </p>`
}

let myChart;

function showChart() {
    let selected = currencies.filter((currency) => { return currency.nombre == currencyToConvertHTML.value})[0]
    let xValues = []
    let yValues = []
    if (selected) {
        fetchHistoryData(selected.codigo).then(() => {
            history.forEach((day) => {
                let formatedDates = formatDate(day.fecha)
                xValues.push(formatedDates)
            })

            history.forEach((day) => {
                console.log(day.valor)
                yValues.push(day.valor.toString())
            })

            if (myChart) {
                myChart.destroy();
            }

            myChart = new Chart("myChart", {
                type: "line",
                data: {
                    labels: xValues.reverse(),
                    datasets: [{
						label: 'Mi conjunto de datos',
                        fill: false,
                        lineTension: 0,
                        backgroundColor:"rgba(0,0,255,1.0)",
                        borderColor: "rgba(0,0,255,0.1)",
                        data: yValues
                    }]
                },
                options: {
                    legend: {display: false},
					title: {
						display: true,
						text: 'Valor de los últimos 10 días del ' + selected.nombre
					}
                }
            });
        })
    }
}


function createArrHistory(data) {
	let arrHistory = []
	for (let i = 0; i <= 9; i++) {
		arrHistory.push(data[i])
	}
	return arrHistory
}

function formatDate(date) {
	let fecha = new Date(date);

	let dia = fecha.getDate();
	let mes = fecha.getMonth() + 1;
	let ano = fecha.getFullYear();

	if (dia < 10) dia = '0' + dia;
	if (mes < 10) mes = '0' + mes;

	let fechaFormateada = dia + '/' + mes + '/' + ano;
	return fechaFormateada
}