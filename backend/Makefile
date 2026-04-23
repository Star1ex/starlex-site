# Makefile TeamTrack 

# Variables


APP_NAME := critiqal-site
MAIN_PACKAGE := ./cmd/app/main.go
GO := go
SWAGGER := swag
TEST_PACKAGE := ./cmd/test/main.go
# --- Backend ---

# Build the binary

build:
	@echo "Building $(APP_NAME)..."
	$(GO) build -o bin/$(APP_NAME) $(MAIN_PACKAGE)

# Test 
test:
	@echo "Running $(APP_NAME)..."
	$(GO) run $(TEST_PACKAGE)
# Run the app
run:
	@echo "Running $(APP_NAME)..."
	$(GO) run $(MAIN_PACKAGE)

# Clean build artifacts

clean:
	@echo "Cleaning..."
	rm -rf bin/*


# --- Swagger ---

swag:
	@echo "Init swag..."
	$(SWAGGER) init -g $(MAIN_PACKAGE)