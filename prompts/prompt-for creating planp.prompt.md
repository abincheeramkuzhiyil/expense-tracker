The initial changes for the 'expense' page is done. Now as the next step, add the UI for 'add-expense' feature. (Do not implement the data pesistenace part yet) 

How to navigate to Add Expense page:
 - When user clicks on the 'Add Expenses' icon button in the 'expenses' page.

Add Expense page UI general description for add-expense page: 
 - The fields in this new page must correspond to the interface 'Expense' in the file 'expense.types.ts'.
 - The heading of the page should be 'Add Expense' which should be left alligned and left to the heading there must be a back icon button.
 - There must be 'Cancel' and 'Save' buttons at the botton of the form alligned to right.

Add Expense form fields detailed description:
a. Date field:
 - Required field.
 - The default date in the Date field varies based on the view mode when user was on the 'Expense' page. The value must be defaulted as follows:
   a1. View mode = 'Day' then the same day the user was on when the user clicked 'add-expense' icon button.
   a2. View mode = 'Month' then the first day of the same month the user was on when the user clicked 'add-expense' icon button.
   a3. View mode = 'Month' the the fist day of the same year the user was on when the user clicked 'add-expense' icon button.
 - When the user navigated to Add-Expense page from 'Expenses' page if the View mode was View 'Month' or 'Year' then add a note above the Date field as "Note: Date defaulted to first day of the month", "Note: Date defaulted to first day of the year". The note must be clear so that the user will take a look.
 - Use URL search params to preserve the View Mode dropdown value and the date vale when navigating to the Add Expense page. (e.g., /expenses?view=year&date=2026-02-21).
b. Category field drop down:
 - required field.
 - The field must be a filterable drop down such that the user can type the category, and the field must filter the values. While typing if user find any thing matching they can select that. Else on save of the 'Add-Expense' form the category value need to get stored seperatly. Also in this case add a note add the field like "Note: This will be added as a new category on save of this expense".
 - Also by default there must be some categories avilable for this add few common categories like Food, Trabsport, Shopping, etc. 
 - For now use the local storage to store the default values as an array and push new category to this array when ever user clicks on Save button.
c. Amount field
 - Requied field.
 - Number field
 - After decimal user can enter only two digits only.
c. Description field:
 - Not required field.
 - Text area without character limit. By default shouw 3 rows for the text area control.

Technical considerations for 'Add-Expense' page:
 - It should be a new page all together.
 - Even though there is a dedicated page for Add-Expense, the functionality need to be in a diffrent component. This is beacuse in future there is a plan to show Add-Expense as a pop-up when user drils down when in 'Year/Month'view modes.

Back button behaviour:
 - When clicking back button and navigating back make sure the value of 'View' drop down field in 'expenses' page should not get reset to default. (meaning: if the drop down value was selected as 'Year' in the expense page when user clicked 'Add expense' button, when clicking back in the 'add-expense' page, the drop down in expense page must remain the same which is 'Year'.) 
 - Also the user should land on the same day/month/year, before they clicked 'Add-Expense' icon button.
  - Use URL search params to preserve the View mode dropdown value and date in the date-nav-bar when navigating back from Add Expense page.

Other important points to consider:
 - Important: Do not implement the data pesistenace part yet.
 - Note to follow the styles that matches the code base.
 - Follow the standards mentioned in the skill.md file.
