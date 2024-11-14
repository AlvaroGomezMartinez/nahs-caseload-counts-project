function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('User Caseload');
}

function filterCaseloadData() {
  Logger.log("Starting filterCaseloadData execution");

  try {
    const user = getCurrentUserEmail();
    Logger.log(`User detected: ${user}`);

    // Complete email-to-campus mapping
    const emailToCampus = {
      "alvaro.gomez@nisd.net": ["Brandeis", "Brennan", "Clark", "Harlan"], //, "Brennan", "Clark", "Harlan", "Holmgreen", "Health Careers", "Excel", "Holmes", "Jay", "Marshall", "O'Connor", "NAHS", "Sotomayor", "Stevens", "Taft", "Warren", "Reddix"],

      "desiree.stjean@nisd.net": ["Brandeis"],
      "sabina.turov@nisd.net": ["Brandeis"],

      "kimberly.obrien@nisd.net": ["Brennan"],
      "dora.salazar@nisd.net": ["Brennan"],

      "elizabeth.rockgutierrez@nisd.net": ["Clark"],
      "karen.pumphrey@nisd.net": ["Clark"],

      "erica.koegellara@nisd.net": ["Harlan"],
      "andrea.aguirre@nisd.net": ["Harlan"],

      "yvette.benavidez-winger@nisd.net": ["Health Careers", "Excel", "Holmgreen"],

      "leticia.lerma@nisd.net": ["Holmes"],
      "heather.meagher@nisd.net": ["Holmes"],

      "erin.ramos@nisd.net": ["Jay"],
      "richard.ramos@nisd.net": ["Jay"],

      "kayla.webb@nisd.net": ["Marshall"],
      "shelley.stogsdill@nisd.net": ["Marshall"],

      "anita.packen@nisd.net": ["O'Connor"],
      "mike.mcnierney@nisd.net": ["O'Connor"],

      "linda.rodriguez@nisd.net": ["Brandeis", "Brennan", "Clark", "Harlan", "Holmgreen", "Health Careers", "Excel", "Holmes", "Jay", "Marshall", "O'Connor", "NAHS", "Sotomayor", "Stevens", "Taft", "Warren", "Reddix"],

      "javonne.collier@nisd.net": ["Sotomayor"],
      "amy.costello@nisd.net": ["Sotomayor"],

      "claudia.justice@nisd.net": ["Stevens"],
      "william.weston@nisd.net": ["Stevens"],

      "jasmine-1.flores@nisd.net": ["Taft"],
      "judy.harlin-alamo@nisd.net": ["Taft"],

      "stephanie.moncada@nisd.net": ["Warren"],
      "jace.pierson@nisd.net": ["Warren"],

      "mark.marcinik@nisd.net": ["Reddix"],
      "lizeth.herrera@nisd.net": ["Reddix"]
    };

    // Get the user's campus from the mapping
    const campusList = emailToCampus[user];
    Logger.log(`User Campus List: ${campusList}`);
    
    if (!campusList) {
      Logger.log(`User (${user}) doesn't have access to a campus.`);
      return JSON.stringify([]); // Return empty JSON array if no campus found for the user
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const currentCaseloadSheet = spreadsheet.getSheetByName("CURRENT CASELOAD");
    const data = currentCaseloadSheet.getDataRange().getValues();

    const headers = data[0];
    const campusIndex = headers.indexOf("HOME CAMPUS");

    // Identify date columns by their headers
    const dateColumns = ["ENTRY DATE", "ESCHOOL ", "LAST ARD", "DATA SHARED", "IEP SHARED"];
    const dateColumnIndexes = dateColumns.map(col => headers.indexOf(col)).filter(idx => idx !== -1);

    Logger.log(`Campus Index: ${campusIndex}`);
    if (campusIndex === -1) {
      throw new Error("No 'HOME CAMPUS' column found in the sheet");
    }

    Logger.log(`${user}'s campus list length is: ${campusList.length}`);

    // Full access to data
    if (campusList.length >= 17) {
      Logger.log("Returning all data (full access)");
      return JSON.stringify(formatDates(removeColumns(data, [7, 8, 9, 12, 13, 14]), dateColumnIndexes)); // Remove columns H, I, J and format dates
    }

    // Filter data for specific campuses
    const filteredRows = data.filter((row, index) => {
      if (index === 0) return false;
      return campusList.includes(row[campusIndex]);
    });

    const result = [headers].concat(filteredRows);
    Logger.log(`Filtered data: ${JSON.stringify(result)}`);
    return JSON.stringify(formatDates(removeColumns(result, [7, 8, 9, 12, 13, 14]), dateColumnIndexes)); // Remove columns H, I, J and format dates
  } catch (error) {
    Logger.log(`Error in filterCaseloadData: ${error.message}`);
    return JSON.stringify([]); // Return empty array in case of error
  }
}

// Helper function to get the current user's email
function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

// Helper function to remove specific columns by indices
function removeColumns(data, columnIndexes) {
  return data.map(row => row.filter((_, index) => !columnIndexes.includes(index)));
}

// Format dates in specific columns to "MM/DD/YY"
function formatDates(data, dateColumnIndexes) {
  return data.map((row, rowIndex) => {
    // Skip headers row
    if (rowIndex === 0) return row;

    dateColumnIndexes.forEach(index => {
      const dateValue = row[index];
      if (dateValue && dateValue instanceof Date) {
        row[index] = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), "MM/dd/yy");
      }
      // } else if (typeof dateValue === 'string' && dateValue.includes("T")) {
      //   const parsedDate = new Date(dateValue);
      //   row[index] = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), "MM/dd/yy");
      // }
    });

    return row;
  });
}
