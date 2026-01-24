FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o paperstack ./...

# --- runtime image ---
FROM gcr.io/distroless/static-debian12 AS runner

WORKDIR /app
COPY --from=builder /app/paperstack .

EXPOSE 8080

CMD ["./paperstack"]
