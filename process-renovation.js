const ticket_id = $("#process-renovation").data("ticket_id");
const requested_item_id = $("#process-renovation").data("requested_item_id");
const ticket_state = $("#process-renovation").data("ticket_state");
console.log({ ticket_id, requested_item_id, ticket_state });

$(document).ready(function () {
  var modal = document.querySelector("fw-modal#modal-contractor");
  var buttonSubmit = document.querySelector("#contractor-submit");
  var vendors = document.getElementById("vendors");
  vendors.search = (value, source) => {
    return fetch("https://trusisor.freshservice.com/api/v2/vendors", {
      method: "GET",
      headers: authHeader
    })
      .then((resp) => resp.json())
      .then((data) => {
        const result = data.vendors.filter((x) => convertViToEn(x.name).includes(convertViToEn(value)));
        return result.map((x) => {
          return {
            text: x.name,
            subText: x.email,
            value: x.email
          };
        });
      });
  };
  if (ticket_state == 0) {
    buttonSubmit.addEventListener("click", async (e) => {
      const values = await vendors.getSelectedItem();
      const resultObject = {};

      values.forEach((item, index) => {
        resultObject[`vendor_${index + 1}_email`] = item.value;
      });
      console.log(resultObject);
      jQuery.ajax({
        url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
        type: "PUT",
        headers: authHeader,
        data: JSON.stringify({
          custom_fields: resultObject
        }),
        success: function (data) {
          jQuery.ajax({
            url: `/api/v2/tickets/${ticket_id}`,
            type: "PUT",
            headers: authHeader,
            data: JSON.stringify({
              custom_fields: { ticket_state: 1 }
            }),
            success: function (data) {
              document.querySelector("#type_toast_right").trigger({ type: "success", content: "Lập hồ sơ mời thầu thành công" });
              modal.close();
            },
            error: function (err) {
              console.log("Error in update ticket: " + err);
            }
          });
        },
        error: function (err) {
          console.log("Error in update ticket: " + err);
        }
      });
    });
  }
  if (ticket_state == 1) {
    var form = document.querySelector("#form-response");
    document.querySelector("#response-submit").addEventListener("click", async (e) => {
      const { values, isValid } = await form.doSubmit(e);
      jQuery.ajax({
        url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
        type: "PUT",
        headers: authHeader,
        data: JSON.stringify({
          custom_fields: values
        }),
        success: function (data) {
          document.querySelector("#type_toast_right").trigger({ type: "success", content: "Cập nhật phan hồi của nhà thầu thành công" });
          modal.close();
        },
        error: function (err) {
          console.log("Error in update ticket: " + err);
        }
      });
    });
    document.querySelector("#confirm-submit").addEventListener("click", async (e) => {
      const { values, isValid } = await form.doSubmit(e);
      jQuery.ajax({
        url: `/api/v2/tickets/${ticket_id}`,
        type: "PUT",
        headers: authHeader,
        data: JSON.stringify({
          custom_fields: { ticket_state: 2 }
        }),
        success: function (data) {
          document.querySelector("#type_toast_right").trigger({ type: "success", content: "Xác nhận phản hồi của nhà thầu thành công" });
          modal.close();
        },
        error: function (err) {
          console.log("Error in update ticket: " + err);
        }
      });
    });
  }

  if (ticket_state == 2) {
    var inputs = document.querySelectorAll('input[name="email_contractor"]');
    var formatted_values = [];

    inputs.forEach(function (input) {
      var value = input.value;
      var email_contractor = { value: value, text: value };
      formatted_values.push(email_contractor);
    });
    document.querySelector("#email_selected_contractor").options = formatted_values;
    document.querySelector("#selected-submit").addEventListener("click", async (e) => {
      const values = await document.querySelector("#email_selected_contractor").getSelectedItem();
      const email_selected_contractor = values[0]?.value;
      jQuery.ajax({
        url: `/api/v2/tickets/${ticket_id}/requested_items/${requested_item_id}`,
        type: "PUT",
        headers: authHeader,
        data: JSON.stringify({
          custom_fields: { email_selected_contractor }
        }),
        success: function (data) {
          jQuery.ajax({
            url: `/api/v2/tickets/${ticket_id}`,
            type: "PUT",
            headers: authHeader,
            data: JSON.stringify({
              custom_fields: { ticket_state: 3 }
            }),
            success: function (data) {
              document.querySelector("#type_toast_right").trigger({ type: "success", content: "Chọn nhà thầu chính thức thành công" });
              modal.close();
            },
            error: function (err) {
              console.log("Error in update ticket: " + err);
            }
          });
        },
        error: function (err) {
          console.log("Error in update ticket: " + err);
        }
      });
    });
  }
});

function convertViToEn(str, toUpperCase = false) {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");

  return toUpperCase ? str.toUpperCase() : str;
}
