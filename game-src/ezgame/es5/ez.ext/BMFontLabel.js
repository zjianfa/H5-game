var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ez;
(function (ez) {
    var BMFontPool = {};
    function registerBMFont(name, desc) {
        desc.name = name;
        if (!desc.dict) {
            desc.dict = {};
            var res = ez.getRes(desc.src);
            if (!res)
                throw new Error("not find BMFont src " + desc.src);
            var offset = res.getData().subRect;
            for (var i in desc.chars) {
                var c = desc.chars[i];
                var s = String.fromCharCode(c[0]);
                var region = new ez.Rect(c[1], c[2], c[3], c[4]);
                if (offset) {
                    region.left += offset.left;
                    region.top += offset.top;
                }
                desc.dict[s] = { rect: region, xOff: c[5], yOff: c[6], advance: c[7] };
            }
        }
        BMFontPool[name] = desc;
    }
    ez.registerBMFont = registerBMFont;
    var BMTextMetric = (function (_super) {
        __extends(BMTextMetric, _super);
        function BMTextMetric(font) {
            var _this = _super.call(this, null) || this;
            _this._font = font;
            _this._fnt = BMFontPool[font];
            if (!_this._fnt)
                throw new Error("not found BMFont: " + font);
            _this.lineHeight = _this._fnt.lineHeight;
            return _this;
        }
        BMTextMetric.prototype.textWidth = function (text) {
            var w = 0;
            var dict = this._fnt.dict;
            for (var i = 0; i < text.length; i++) {
                var ch = dict[text.charAt(i)];
                if (ch)
                    w += ch.advance;
            }
            return w;
        };
        BMTextMetric.prototype.measureLine = function (text, maxWidth, wordBreak) {
            if (text.length == 0)
                return [];
            var lines = [];
            var idx = 0;
            var w1 = 0;
            var ch;
            var dict = this._fnt.dict;
            if (wordBreak) {
                var s1;
                while (true) {
                    var end = ez.TextMetric.GetNextWordBreak(text, idx);
                    var str = text.substring(0, end);
                    var w = this.textWidth(str);
                    if (w >= maxWidth) {
                        if (w1 > 0) {
                            lines.push({ text: s1, width: w1, newline: false });
                            text = text.substring(idx);
                            idx = 0;
                            w1 = 0;
                        }
                        else {
                            w = 0;
                            ch = dict[text.charAt(0)];
                            if (ch)
                                w += ch.advance;
                            for (var i = 1; i < end; i++) {
                                ch = dict[text.charAt(i)];
                                if (ch && w + ch.advance > maxWidth) {
                                    lines.push({ text: text.substring(0, i), width: w, newline: false });
                                    text = text.substring(i);
                                    idx = 0;
                                    w1 = 0;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        idx = end;
                        w1 = w;
                        s1 = str;
                    }
                }
            }
            else {
                var w = 0;
                for (var i = 0; i < text.length; i++) {
                    ch = dict[text.charAt(i)];
                    if (ch)
                        w += ch.advance;
                    if (w > maxWidth) {
                        var n = i - idx;
                        if (n == 0)
                            n = 1;
                        else
                            w -= ch.advance;
                        lines.push({ text: text.substring(idx, idx + n), width: w, newline: false });
                        idx = i - n;
                        w = 0;
                    }
                }
                if (idx < text.length)
                    lines.push({ text: text.substring(idx, text.length), width: w, newline: true });
            }
            return lines;
        };
        BMTextMetric.prototype.measureText = function (text, width, height, format) {
            if (text == null)
                text = "";
            if (typeof text !== "string")
                text = text.toString();
            if (text == "") {
                this.maxWidth = 0;
                this.lines = [];
                return;
            }
            this.lines = [];
            this.maxWidth = width;
            text = text.replace("\r\n", "\n");
            var lines = text.split("\n");
            var wordBreak = !!(format & ez.TextFormat.WordBreak);
            var ellipse = false;
            var maxLine = Math.max(1, (height / this.lineHeight) | 0);
            if (format & ez.TextFormat.MultiLine) {
                for (var i = 0; i < lines.length; i++) {
                    var l = this.measureLine(lines[i], width, wordBreak);
                    if (this.lines.length + l.length > maxLine) {
                        this.lines = this.lines.concat(l.slice(0, maxLine - this.lines.length));
                        break;
                    }
                    this.lines = this.lines.concat(l);
                }
                this.maxWidth = this.lines.reduce(function (prev, line) { return Math.max(prev, line.width); }, 0);
            }
            else {
                var k = this.measureLine(lines[0], width, false)[0];
                if (k.text.length < lines[0].length) {
                    if (k.text.length > 1)
                        k.text = k.text.substring(0, k.text.length - 1);
                    k.text += "...";
                    k.width = this.textWidth(k.text);
                }
                this.lines.push(k);
                this.maxWidth = k.width;
            }
        };
        return BMTextMetric;
    }(ez.TextMetric));
    ez.BMTextMetric = BMTextMetric;
    var BMFontLabelSprite = (function (_super) {
        __extends(BMFontLabelSprite, _super);
        function BMFontLabelSprite(parent, id) {
            return _super.call(this, parent, id) || this;
        }
        BMFontLabelSprite.prototype.getType = function () {
            return BMFontLabelSprite.Type;
        };
        BMFontLabelSprite.prototype._dispose = function () {
            this._res = null;
            this._texture = null;
            _super.prototype._dispose.call(this);
        };
        Object.defineProperty(BMFontLabelSprite.prototype, "textMetric", {
            get: function () {
                if (!this._textMetric) {
                    this._textMetric = new BMTextMetric(this._font);
                    var w = this.width || 500;
                    var h = this.height || this._fnt.lineHeight;
                    if (this._margin) {
                        w -= this._margin[0] + this._margin[2];
                        h -= this._margin[1] + this._margin[3];
                    }
                    this._textMetric.measureText(this._text, w, h, this._format);
                    if (this._lineHeight)
                        this._textMetric.lineHeight = this._lineHeight;
                }
                return this._textMetric;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BMFontLabelSprite.prototype, "lineHeight", {
            set: function (val) {
                if (val == this._lineHeight)
                    return;
                this._lineHeight = val;
                if (!this._textMetric)
                    return;
                this._textMetric.lineHeight = val || this._fnt.lineHeight;
                this.setDirty();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BMFontLabelSprite.prototype, "font", {
            get: function () {
                return this._font;
            },
            set: function (val) {
                if (val == this._font)
                    return;
                this._font = val;
                this._fnt = BMFontPool[val];
                if (!this._fnt)
                    throw new Error("BMFont " + val + " is not found!");
                this._textMetric = null;
                var res = ez.getRes(this._fnt.src);
                if (!res)
                    throw new Error("BMFont src " + val + " is not found!");
                this._res = res;
                function onImgReady() {
                    var ctx = this.ctx;
                    if (ctx._res != this.data)
                        return;
                    ctx._texture = ctx._res.getData();
                    ctx.setDirty();
                }
                if (res.state == 2 || res.state == 1)
                    res.load(onImgReady, { ctx: this, data: res });
                else
                    this._texture = res.getData();
                this.setDirty();
            },
            enumerable: true,
            configurable: true
        });
        BMFontLabelSprite.prototype._draw = function (rc, opacity) {
            if (this.text == "")
                return;
            if (!this._texture)
                return;
            opacity *= this.opacity;
            if (opacity < 0.01)
                return;
            if (useWGL)
                this.applyEffect(rc);
            var transform = ezasm.getglobalTrans(this._handle);
            if (this._bkColor) {
                rc.setFillColor(this._bkColor);
                rc.fillRect(this.width, this.height, ezasm.getglobalTrans(this._handle));
            }
            var textMetric = this.textMetric;
            var s = textMetric.lineHeight;
            var w = this.width || textMetric.maxWidth;
            var h = this.height || s * textMetric.lines.length;
            var x = this._margin ? this._margin[0] : 0;
            var y = this._margin ? this._margin[1] : 0;
            if (this._margin) {
                w -= this._margin[0] + this._margin[2];
                h -= this._margin[1] + this._margin[3];
            }
            var a = this._align;
            var lines = textMetric.lines;
            if ((a & ez.AlignMode.VCenter) == ez.AlignMode.VCenter)
                y += (h - lines.length * s) * 0.5;
            else if ((a & ez.AlignMode.Bottom) == ez.AlignMode.Bottom)
                y += h - lines.length * s;
            ezasm.saveTempStack();
            var tex = this._texture;
            var fnt = this._fnt;
            for (var i = 0; i < lines.length; i++) {
                var x0 = x;
                var line = textMetric.lines[i];
                if ((a & ez.AlignMode.Center) == ez.AlignMode.Center)
                    x0 += (w - line.width) * 0.5;
                else if ((a & ez.AlignMode.Right) == ez.AlignMode.Right)
                    x0 += w - line.width;
                for (var j = 0; j < line.text.length; j++) {
                    var ch = fnt.dict[line.text.charAt(j)];
                    if (ch) {
                        var t = ezasm.tempAllocMat2x3(1, 0, 0, 1, x0 + ch.xOff, y + ch.yOff);
                        ezasm.mat2x3Append(t, transform);
                        rc.drawImage(tex, t, ch.rect.width, ch.rect.height, ch.rect);
                        x0 += ch.advance;
                    }
                }
                y += s;
            }
            ezasm.restoreTempStack();
        };
        BMFontLabelSprite.Type = "BMFontLabel";
        return BMFontLabelSprite;
    }(ez.LabelSprite));
    ez.BMFontLabelSprite = BMFontLabelSprite;
    ez.Sprite.register(BMFontLabelSprite.Type, function (p, id) { return new BMFontLabelSprite(p, id); });
})(ez || (ez = {}));
(function (ez) {
    var ui;
    (function (ui) {
        var BMFontLabel = (function (_super) {
            __extends(BMFontLabel, _super);
            function BMFontLabel(parent) {
                var _this = _super.call(this, parent, new ez.BMFontLabelSprite(parent._displayStage)) || this;
                _this._init(BMFontLabel);
                _this.bind("text", _this._sprite);
                _this.bind("font", _this._sprite);
                _this.bind("format", _this._sprite);
                _this.bind("lineHeight", _this._sprite);
                _this.bind("align", _this._sprite);
                _this.bind("margin", _this._sprite);
                return _this;
            }
            BMFontLabel.prototype.measureBound = function (width, height, force) {
                if (!force && this._bound)
                    return;
                var t = this._sprite.textMetric;
                _super.prototype.measureBound.call(this, width || t.maxWidth, height || (t ? t.lineHeight * t.lines.length : 0), force);
            };
            BMFontLabel.ClassName = "BMFontLabel";
            BMFontLabel.Properties = [
                { name: "text", default: "", type: "string" },
                { name: "font", type: "string" },
                { name: "format", type: "TextFormat", converter: ez.parse.getEnumParser(ez.TextFormat) },
                { name: "lineHeight", type: "number", converter: ez.parse.Int },
                { name: "align", type: "AlignMode", converter: ez.parse.getEnumParser(ez.AlignMode) },
                { name: "margin", type: "Number4", converter: ez.parse.Number4 },
            ];
            return BMFontLabel;
        }(ui.Visual));
        ui.BMFontLabel = BMFontLabel;
        ui.initUIClass(BMFontLabel, ui.Visual);
    })(ui = ez.ui || (ez.ui = {}));
})(ez || (ez = {}));

//# sourceMappingURL=BMFontLabel.js.map
