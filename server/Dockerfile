# --- build stage ---
FROM golang:1.22-alpine AS build
WORKDIR /src

# CGO off → a fully static binary that runs on a distroless/scratch base.
# GOFLAGS=-mod=mod lets the build resolve modules even before `go mod tidy`
# has been run locally (it writes go.sum on the fly). Commit go.sum to speed
# this up and pin dependencies.
ENV CGO_ENABLED=0 GOOS=linux GOFLAGS=-mod=mod

COPY . .
RUN go build -ldflags="-s -w" -o /out/server ./cmd/server

# --- runtime stage ---
FROM gcr.io/distroless/static-nonroot
COPY --from=build /out/server /server
# Render injects $PORT and the app binds to it; EXPOSE is just documentation.
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
