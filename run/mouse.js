
function fMouseMove(e)
{
	var rect = e5.getBoundingClientRect();
	e = e || window.event;
	nBDE8 = (e.clientX - rect.left) * 255 / (rect.right  - rect.left) + 0.5 | 0;
	nBDE9 = 255 - ((e.clientY - rect.top)  * 191 / (rect.bottom - rect.top)  + 0.5 | 0);
}

function fMouseDown(e)
{
	e = e || window.event;
	nBDEA &= (0xFF ^ (1 << e.button));
	return fEndEvent(e, 2);
}

function fMouseUp(e)
{
	e = e || window.event;
	nBDEA |= 1 << e.button;
	return fEndEvent(e, 2);
}

function fContext(e)
{
	e = e || window.event;
	return fEndEvent(e, 2);
}
