FROM golang:1.24.9-alpine AS builder

WORKDIR /usr/local/src

RUN apk --no-cache add bash git make gcc gettext musl-dev

# dependencies
COPY go.mod go.sum ./
RUN go mod download

# build
COPY . .
RUN go build -o ./bin/app ./cmd/app


FROM alpine

RUN apk --no-cache add ca-certificates

COPY --from=builder /usr/local/src/bin/app /
COPY --from=builder /usr/local/src/.env /

EXPOSE 3000

CMD ["/app"]




