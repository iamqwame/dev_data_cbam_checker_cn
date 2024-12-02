document.addEventListener("DOMContentLoaded", () => {
  // URL of the Excel file
  const url =
    "https://raw.githubusercontent.com/RomanHaak/streamlit-example/master/CBAM_Estimator_Default_Values.xlsx";

  // Get form elements
  const cnCodeSelect = document.getElementById("cn-code");
  const countrySelect = document.getElementById("country");
  const quantityInput = document.getElementById("quantity");
  const estimatedCostElement = document.getElementById("estimated-cost");
  const errorMessage = document.getElementById("error-message");

  // Variables to store emission factors and country multipliers
  let emissionFactors = {};
  let countryMultipliers = {};

  // Method to populate the CN-Code dropdown
  async function populateCnCodeDropdown(sheet) {
    const cnCodeData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Populate CN-Code dropdown and store emission factors
    cnCodeSelect.innerHTML =
      '<option value="">Wählen Sie einen CN-Code</option>';
    cnCodeData.slice(7).forEach((row) => {
      const code = row[0]; // Column 1
      const description = row[1]; // Column 2
      const emissionFactor = row[2]; // Column 3 (adjust based on your data structure)
      if (code && description && emissionFactor) {
        emissionFactors[code] = emissionFactor; // Store emission factor
        const option = document.createElement("option");
        option.value = code;
        option.textContent = `${code} - ${description}`;
        cnCodeSelect.appendChild(option);
      }
    });
  }

  // Method to populate the Country dropdown
  async function populateCountryDropdown(sheet) {
    const countryData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Populate Country dropdown and store multipliers
    countrySelect.innerHTML =
      '<option value="">Wählen Sie ein Herkunftsland</option>';
    countryData.slice(7).forEach((row) => {
      const countryName = row[7]; // Column H (Index 7)
      const multiplier = row[8]; // Column I (Index 8, adjust based on your data structure)
      if (countryName && multiplier) {
        countryMultipliers[countryName.toLowerCase()] = multiplier; // Store multiplier
        const option = document.createElement("option");
        option.value = countryName.toLowerCase(); // Use lowercase for value
        option.textContent = countryName; // Display name as is
        countrySelect.appendChild(option);
      }
    });
  }

  // Fetch and initialize dropdowns
  async function initializeDropdowns() {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const data = new Uint8Array(response.data);
      const workbook = XLSX.read(data, { type: "array" });

      // Populate CN-Code dropdown
      const cnCodeSheet = workbook.Sheets["Alle_Default_Values_Mit_Lücken"];
      await populateCnCodeDropdown(cnCodeSheet);

      // Populate Country dropdown
      const countrySheet = workbook.Sheets["Alle_CN_Codes"];
      await populateCountryDropdown(countrySheet);
    } catch (error) {
      console.error("Error loading dropdown data:", error);
      cnCodeSelect.innerHTML = '<option value="">Fehler beim Laden</option>';
      countrySelect.innerHTML = '<option value="">Fehler beim Laden</option>';
    }
  }

  // Calculate estimated cost
  function calculateCost() {
    const cnCode = cnCodeSelect.value;
    const country = countrySelect.value;
    const quantity = parseFloat(quantityInput.value);

    if (!cnCode || !country || isNaN(quantity) || quantity <= 0) {
      errorMessage.style.display = "block";
      estimatedCostElement.textContent = "--";
      return;
    }

    errorMessage.style.display = "none";

    // Fetch emission factor and country multiplier
    const emissionFactor = emissionFactors[cnCode];
    const countryMultiplier = countryMultipliers[country];

    if (!emissionFactor || !countryMultiplier) {
      errorMessage.style.display = "block";
      estimatedCostElement.textContent = "--";
      return;
    }

    // Correct calculation formula
    const estimatedCost = emissionFactor * countryMultiplier * quantity;
    estimatedCostElement.textContent = `${estimatedCost.toFixed(2)} €`;
  }

  // Log dropdown changes
  function logSelectionChange() {
    console.log("CN-Code selected:", cnCodeSelect.value);
    console.log("Country selected:", countrySelect.value);
  }

  // Add event listeners
  cnCodeSelect.addEventListener("change", () => {
    logSelectionChange();
    calculateCost();
  });

  countrySelect.addEventListener("change", () => {
    logSelectionChange();
    calculateCost();
  });

  quantityInput.addEventListener("input", calculateCost);

  // Initialize dropdowns
  initializeDropdowns();
});
