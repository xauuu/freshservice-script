var form = document.createElement("fw-form");
var formContainer = document.querySelector("#form-container");
document.querySelector("#submit").addEventListener("click", async (e) => {
  const { values, isValid } = await form.doSubmit(e);
  console.log({ values, isValid });
  jQuery.ajax({
    url: '/api/v2/tickets/{{last (split ticket.human_display_id "-")}}',
    type: "PUT",
    headers: authHeader,
    data: JSON.stringify({
      custom_fields: {
        ticket_state: 1
      }
    }),
    success: function (data) {
      console.log(data);
    },
    error: function (err) {
      console.log("Error in update ticket: " + err);
    }
  });
});
var formSchema = {
  name: "Make a construction plan",
  fields: [
    {
      name: "expected_start_time",
      label: "Expected start time",
      type: "DATE",
      position: 1,
      required: true,
      Placeholder: "Enter…",
      choices: []
    },
    {
      name: "expected_end_time",
      label: "Expected end time",
      type: "DATE",
      position: 2,
      required: true,
      Placeholder: "Enter…",
      choices: []
    },
    {
      name: "estimated_cost",
      label: "Estimated cost",
      type: "NUMBER",
      position: 3,
      required: true,
      Placeholder: "Enter…",
      choices: []
    },
    {
      name: "ground_development_department_notes",
      label: "Ground development department notes",
      type: "PARAGRAPH",
      position: 4,
      required: true,
      Placeholder: "Enter…",
      choices: []
    }
  ]
};
var initialValues = {};
formContainer.prepend(form);

form.formSchema = formSchema;
form.initialValues = initialValues;
