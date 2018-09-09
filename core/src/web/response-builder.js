module.exports = class ResponseBuilder {
    static get VALID_FIELDS() {
        return [
            'status',
            'headers',
            'headers.request',
            'headers.response',
            'response',
            'response.cookies',
            'response.script',
            'response.content',
            'response.content.notRendered',
            'response.content.rendered'
        ];
    }

    constructor(page, req) {
        this.page = page;
        this.req = req;
    }

    build() {
        this.response = {};
        this.fullResponse = {
            status: this.page.getNotRenderedResponse().status,
            headers: {
                request: this.page.getRequestHeaders(),
                response: this.page.getNotRenderedResponse().headers
            },
            response: {
                cookies: this.page.getRenderedResponse().cookie,
                script: this.page.getResponseScript(),
                content: {
                    notRendered: this.page.getNotRenderedResponse().content,
                    rendered: this.page.getRenderedResponse().content
                }
            }
        }

        if (!this._hasShow())
            return this.fullResponse;

        return this.response;
    }

    _hasShow() {
        let show = [];

        try {
            show = this.req.body.show;
        } catch (exception) {
            show = [];
        }

        if (show == undefined)
            return false;

        if (!(show instanceof Array))
            throw new Error('show JSON parameters must be an array');

        if (show.length == 0)
            return false;

        for (const partShow of show) {
            if (!ResponseBuilder.VALID_FIELDS.includes(partShow))
                throw new Error(`show value [${partShow}] on JSON parameters is not supported`);

            if (partShow == 'status') {
                this.response.status = this.fullResponse.status;
                continue;
            }

            if (partShow == 'headers') {
                this.response.headers = this.fullResponse.headers;
                continue;
            }

            if (partShow == 'headers.request') {
                if (this.response.headers == undefined)
                    this.response.headers = {};

                this.response.headers.request = this.fullResponse.headers.request;
                continue;
            }

            if (partShow == 'headers.response') {
                if (this.response.headers == undefined)
                    this.response.headers = {};

                this.response.headers.response = this.fullResponse.headers.response;
                continue;
            }

            if (partShow == 'response') {
                this.response.response = this.fullResponse.response;
                continue;
            }

            if (partShow == 'response.cookies') {
                if (this.response.response == undefined)
                    this.response.response = {};

                this.response.response.cookies = this.fullResponse.response.cookies;
                continue;
            }

            if (partShow == 'response.script') {
                if (this.response.response == undefined)
                    this.response.response = {};

                this.response.response.script = this.fullResponse.response.script;
                continue;
            }

            if (partShow == 'response.content') {
                if (this.response.response == undefined)
                    this.response.response = {};

                this.response.response.content = this.fullResponse.response.content;
                continue;
            }

            if (partShow == 'response.content.notRendered') {
                if (this.response.response == undefined)
                    this.response.response = {};

                if (this.response.response.content == undefined)
                    this.response.response.content = {};

                this.response.response.content.notRendered = this.fullResponse.response.content.notRendered;
                continue;
            }

            if (partShow == 'response.content.rendered') {
                if (this.response.response == undefined)
                    this.response.response = {};

                if (this.response.response.content == undefined)
                    this.response.response.content = {};

                this.response.response.content.rendered = this.fullResponse.response.content.rendered;
            }
        }

        return true;
    }
}