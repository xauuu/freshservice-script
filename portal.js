function renderHome() {
    var lang = $("#portal-script").data("language");
    var workspace_id = $("#portal-script").data("workspace_id");

    var modal = $(".modal-container");
    var close = $(".close");
    close.click(function () {
        modal.hide();
    });

    $(document).ready(function () {
        var appList = [];
        var processList = [];
        document.getElementById("sr-search").addEventListener("input", (e) => {
            const activeApp = $("input[name=app_code]").val();
            const keyword = e.currentTarget.value.toLowerCase();
            if (!keyword) {
                renderProcess(processList);
                return;
            }
            const filteredProcesses = processList.filter(function (item) {
                const processName = item.data.process_name.toLowerCase();
                const appCode = item.data.app_code;

                return processName.includes(keyword) && appCode.includes(activeApp);
            });

            renderProcess(filteredProcesses);
        });

        jQuery.ajax({
            type: "GET",
            url: `/api/v2/objects/27000052210/records?query=language%20%3A%20%27${lang}%27%20AND%20is_active%20%3A%20%271%27`,
            dataType: "json",
            headers: authHeader,
            success: function (response) {
                appList = getUniqueAppInfo(response.records);
                processList = response.records;
                renderApp(appList);
            }
        });

        function getUniqueAppInfo(jsonData) {
            const uniqueAppInfo = new Map();

            jsonData.forEach((record) => {
                const { app_code, app_name, app_image } = record.data;

                const key = `${app_code}-${app_name}`;
                if (app_image) {
                    uniqueAppInfo.set(key, { app_code, app_name, app_image });
                } else if (!uniqueAppInfo.has(key)) {
                    uniqueAppInfo.set(key, { app_code, app_name, app_image: "" });
                }
            });
            const result = Array.from(uniqueAppInfo.values());
            return result;
        }

        function renderApp(list) {
            let html = "";
            jQuery.map(list, function (item, index) {
                const { app_name, app_code, app_image } = item;
                html += `<div class="item" data-app="${app_code}" data-title="${app_name}">
                                <div class="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <g clip-path="url(#clip0_9606_143)">
                                            <path d="M2.5 18.3333H16.6667L19.1667 7.5H5L2.5 18.3333Z" stroke="#2579FF"
                                                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                                            <path d="M15.8333 4.16602H8.33325L6.66659 1.66602H0.833252V14.9993" stroke="#2579FF"
                                                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_9606_143">
                                                <rect width="20" height="20" fill="white" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                                <div class="content">
                                    <div class="name">${app_name}</div>
                                    <div class="description max-line-2">${app_name}</div>
                                </div>
                            </div>`;
            });

            jQuery(".service-catalogs").html(html);
            $(".service-catalogs .item").click(function (e) {
                e.preventDefault();
                modal.show();
                const appCode = jQuery(this).data("app");
                const title = jQuery(this).data("title");
                $("input[name=app_code]").val(appCode);
                const newPList = processList.filter((item) => item.data.app_code == appCode);
                renderProcess(newPList);
            });
        }

        function renderProcess(list) {
            $("#pagination-item").pagination({
                dataSource: list,
                pageSize: 4,
                callback: function (data, pagination) {
                    let html = "";
                    $.each(data, function (index, item) {
                        const { process_image, process_name, process_url, process_description } = item.data;
                        html += `<a href="${process_url}" class="item">
                                        <div class="icon">
                                            ${process_image ? process_image : defaultImage}
                                        </div>
                                        <div class="content">
                                            <div class="name">${process_name}</div>
                                            <div class="description max-line-2">${process_description}</div>
                                        </div>
                                    </a>`;
                    });
                    $(".service-items").html(html);
                }
            });
        }
    });

    $(document).ready(function () {
        jQuery.ajax({
            type: "GET",
            url: `/api/v2/solutions/categories?workspace_id=${workspace_id}`,
            dataType: "json",
            headers: authHeader,
            success: function (response) {
                renderCategory(response.categories?.slice(1));
                renderFooter(response.categories?.slice(1));
            }
        });
        function renderCategory(list) {
            let html = ``;
            jQuery.map(list, function (item, index) {
                const { id, name } = item;
                html += `<a href="/support/solutions/${id}">${name}</a>`;
            });
            jQuery(".solutions").html(html);
        }
        function renderFooter(list) {
            let html = ``;
            jQuery.map(list, function (item, index) {
                if (index > 3) return;
                const { id, name } = item;
                html += `<li><a href="/solutions/${id}">${name}</a></li>`;
            });
            jQuery("#services").html(html);
        }
    });
}

renderHome();
