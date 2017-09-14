
function gotoTest() {
    var tableNumber = window.prompt("table number ?", "");
    if (tableNumber === null || tableNumber === "") {
        return;
    }
    window.location="./game.html?table="+tableNumber;
}