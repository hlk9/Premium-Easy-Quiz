var subjectEl = document.querySelector(".ilc_rte_tlink_RTETreeLink"),
    subject = subjectEl ? subjectEl.textContent.replace(/\?/g, "") : "",
    apiUrl = "https://api.quizpoly.xyz",
    server = window.location.origin;
async function main() {
    if (subject) {
        const e = await getOnlineAnswer(subject).catch((e) =>
            alert(`Có lỗi khi lấy đáp án, vui lòng thử lại sau: ${e}`),
        );
        if (e && e.length) {
            if (5 <= e.length)
                if (!(await u()))
                    return chrome.runtime.sendMessage({
                        type: "close_quiz_popup",
                    });
            chrome.runtime.sendMessage(
                { type: "open_quiz_popup" },
                async () => {
                    chrome.storage.local.set({ subjectName_: subject }),
                        writeHTML(e),
                        sendUserUsing(
                            await getUserInfo(),
                            "lms-online",
                            subject,
                        );
                },
            );
        } else
            confirm(
                "Bài này chưa có đáp án, bạn có muốn đóng góp đáp án cho người làm sau?",
            ) &&
                chrome.runtime.sendMessage(
                    { type: "open_online_popup" },
                    () => {
                        chrome.storage.local.set({ subjectName_: subject }),
                            setTimeout(
                                () =>
                                    chrome.runtime.sendMessage({
                                        type: "online_data",
                                        subject: subject,
                                        studentCode: user.studentCode,
                                    }),
                                1e3,
                            );
                    },
                );
    } else alert("Không lấy được bài học, làm mới trang và thử lại");
}
function writeHTML(e) {
    let t = "",
        n = 1,
        r = document.createElement("span"),
        s = document.createElement("em");
    var i;
    for (i of e)
        (r.innerText = i.ques),
            (s.innerText = i.ans),
            (t += `
    <tr><td style='width:2.5rem; text-align:center';>${n++}</td><td><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></td><td>${
                r.outerHTML
            }</td></tr>
    <tr><td></td><td><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></td><td>${
        s.outerHTML
    }</td></tr>
    `);
    setTimeout(
        () =>
            chrome.runtime.sendMessage({
                type: "quiz_data",
                html: t,
                online: !0,
            }),
        1e3,
    );
}
function parseHTML(e) {
    return new DOMParser().parseFromString(e, "text/html");
}
async function sendUserUsing(e, t, n) {
    chrome.runtime.sendMessage({
        type: "send_user_using",
        domain: window.location.host,
        data: { ...e, getQuizType: t, subjectName: n },
    });
}
function u() {
    return new Promise((t) => {
        chrome.runtime.sendMessage({ type: "open_quiz_link" }, (e) => {
            "success" == e || "p" == e
                ? t(!0)
                : ("not_logged" == e &&
                      alert(
                          "Bạn chưa đăng nhập tiện ích. Click vào icon tiện ích sau đó đăng nhập để sử dụng",
                      ),
                  t(!1));
        });
    });
}
async function getOnlineAnswer(e) {
    return new Promise((n, r) => {
        chrome.runtime.sendMessage(
            { type: "get_online_answer", subject: e },
            (e) => {
                if (chrome.runtime.lastError) return r("send_message_error");
                var [t, e] = e;
                if (t) {
                    if ("require_auth" == e)
                        return (
                            alert(
                                "Bạn chưa đăng nhập tiện ích. Click vào icon tiện ích sau đó đăng nhập để sử dụng",
                            ),
                            r("require_auth")
                        );
                    n(e);
                } else r("request_failed");
            },
        );
    });
}
async function getUserInfo() {
    let e = "NULL",
        t = "NULL",
        n = server;
    var r = window.location.host,
        s = `${server}/ilias.php?baseClass=${
            "lms-ptcd.poly.edu.vn" == r
                ? "ilPersonalDesktopGUI"
                : "ilDashboardGUI"
        }&cmd=jumpToProfile`;
    try {
        const i = await fetch(s, { method: "GET", redirect: "follow" });
        if (!i.ok) return { name: e, studentCode: t, userServer: n };
        const o = parseHTML(await i.text());
        (e = o.querySelector("#usr_firstname").value),
            (t = o.querySelector("#hiddenne_un").value),
            (n = o.querySelector("#hiddenne_dr")?.value?.replace("USER_", "")),
            "lms-ptcd.poly.edu.vn" == r && n && (n = "PTCD " + n);
    } catch (e) {
        console.error(e);
    }
    return { name: e, studentCode: t, userServer: n };
}
main();
