#!/bin/bash

# Create a temporary directory for building
rm -rf package
mkdir -p package

# Copy lambda function
cp lambda_function.py package/

# Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt --target package/ --no-cache-dir

# Remove unnecessary files to reduce package size
find package/ -type d -name "__pycache__" -exec rm -rf {} +
find package/ -type d -name "*.dist-info" -exec rm -rf {} +
find package/ -type d -name "*.egg-info" -exec rm -rf {} + 