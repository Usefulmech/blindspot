"""
Quick smoke test for the GetWhereNext API.
Run from blindspot-backend/: python tests/test_api.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from services.external.getwherenext import fetch_col_data

TEST_CITIES = ["Dubai", "Kigali", "London", "Lagos", "Singapore"]

async def main():
    for city in TEST_CITIES:
        print(f"\n--- {city} ---")
        result = await fetch_col_data(city)
        if result:
            print(f"  Country:     {result.get('country')}")
            print(f"  Monthly est: ${result.get('monthly_estimate_usd')}")
            print(f"  Rent (1BR):  ${result.get('monthly_rent_1br_city_centre')}")
            print(f"  Groceries:   ${result.get('monthly_groceries')}")
            print(f"  Transport:   ${result.get('monthly_transport')}")
            print(f"  Source:      {result.get('source')}")
        else:
            print(f"  NOT FOUND — city not in GetWhereNext dataset")

asyncio.run(main())
