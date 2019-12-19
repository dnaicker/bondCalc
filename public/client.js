var globalData = []

$(document).ready(function () {
  getData()
  populate_numbers()

  $("#calculate_mortgage").click(function(event) {
    event.preventDefault();
    $("#result_table").css("display", "initial")
    calculatePeriod()
  });

  $("#save_calculation").click(function (event) {
    saveCalculation()
    $().alert()
  });
  
  $("#calculation_selection").change(function(event) {
    reloadData(globalData[event.target.value])
    $( "#calculate_mortgage" ).trigger( "click" )
  })
})

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function calculatePeriod() {
  //amount paid off minus total loan amount taken out
  let current_loan_amount = $("#purchase_price").val()
  let total_period = ($("#years").val() * 12)
  let table = []
  let chart = []
  let period = []

  let data_set_annual_loan_payment = []
  let data_set_amount_paid_to_bank = []
  let data_set_amount_paid_to_loan = []

  console.log(current_loan_amount);

  for (let i = 0; i < $("#years").val(); i++) {
    let payment_to_bank = (calcAnnualMortgagePayment(current_loan_amount, $("#years").val() - i)).toFixed(2)

    let percentage_to_bank = ((payment_to_bank / $("#fixed_interest_rate").val()) / 100).toFixed(2)

    let amount_paid_to_bank = (payment_to_bank - (payment_to_bank * (percentage_to_bank / 100))).toFixed(2)

    let amount_paid_to_loan = (payment_to_bank - amount_paid_to_bank).toFixed(2)
    
    let precentage_to_loan = ((amount_paid_to_loan / $("#fixed_interest_rate").val()) / 100).toFixed(2)


    let beginning_balance = current_loan_amount
    current_loan_amount = (current_loan_amount - payment_to_bank).toFixed(2)
    total_period = total_period - 12
    years = $("#years").val() - i
    period.push(years.toString())
    table.push({ beginning_balance, current_loan_amount, years, payment_to_bank, percentage_to_bank, amount_paid_to_bank, amount_paid_to_loan, precentage_to_loan })

    data_set_annual_loan_payment.push(payment_to_bank)
    data_set_amount_paid_to_bank.push(amount_paid_to_bank)
    data_set_amount_paid_to_loan.push(amount_paid_to_loan)
  }


  chart.push({
    label: 'Payment to Bank',
    backgroundColor: '#00FF00',
    data: data_set_amount_paid_to_bank
  })

  chart.push({
    label: 'Payment to Loan',
    backgroundColor: '#0000FF',
    data: data_set_amount_paid_to_loan
  })

  createChart(period, chart)

  $('#table').bootstrapTable('destroy').bootstrapTable({ data: table })
}

function totalPriceFormatter(data) {
  var field = this.field
  return '$' + data.map(function (row) {
    return +row[field].substring(1)
  }).reduce(function (sum, i) {
    return sum + i
  }, 0)
}

function calcAnnualMortgagePayment(loanAmount, period) {
  let calc = (calcMonthlyMortgagePayment(loanAmount, period) * 12)
  // console.log('annual', calc.toFixed(2), '%')
  return calc
}


function calcMonthlyMortgagePayment(loanAmount, period) {
  let calc = mortgagePayment(loanAmount, (($("#fixed_interest_rate").val() / 100) / 12), (period * 12))
  // console.log('monthly',calc.toFixed(2))
  return calc
}


function mortgagePayment(balance, rate, periods) {
  return ((balance * rate)/(1 - (1/Math.pow((1+rate),periods))))
}

function populate_numbers() {
  $("#deposit").val(0)
  $("#years").val(20)
  $("#purchase_price").val(100000)
  $("#fixed_interest_rate").val(12)
}



function createChart(period, data) {
  var ctx = document.getElementById('canvas').getContext('2d');
  window.myBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: period,
      datasets: data
    },
    options: {
      title: {
        display: true,
        text: 'Summary'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }
  });
}

// get calculations from database
function getData() {
  fetch("/getCalculations", {})
    .then(res => res.json())
    .then(response => {
      if(!response) { resolve() }
    
      response.forEach(row => {
        let data = JSON.parse(row.calculations)
        globalData[data.name] = data
        appendCalc(data);
      });
    });
}

// update list of calculations
const appendCalc = calculation => {
  var option = $("<option value='"+ calculation.name +"'></option>").text(calculation.name)
  // option.value = calculation.name
    
    //.attr("purchasePrice", calculation.purchasePrice).attr("deposit", calculation.deposit).attr("years", calculation.years).attr("fixedInterestRate", calculation.fixedInterestRate)

  $("#calculation_selection").prepend(option);
};

// listen for the form to be submitted and add a new dream when it is
function saveCalculation() {
  const data = {
    calculations: {
      purchasePrice: $("#purchase_price").val(),
      fixedInterestRate: $("#fixed_interest_rate").val(),
      years: $("#years").val(),
      deposit: $("#deposit").val(),
      name: $("#calculation_name").val()  
    }
  };

  console.log(JSON.stringify(data))
  
  fetch("/addCalculations", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
      $("#calculation_selection").empty()
      getData()
    });

};


function reloadData(data) {
  $("#deposit").val(data.deposit)
  $("#years").val(data.years)
  $("#purchase_price").val(data.purchasePrice)
  $("#fixed_interest_rate").val(data.fixedInterestRate)
}