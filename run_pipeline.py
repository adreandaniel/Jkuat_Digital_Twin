import importlib
import time

STEPS = [
    ("01 AOI", "python.01_aoi"),
    ("02 Terrain", "python.02_terrain"),
    ("03 Hydrology", "python.03_hydrology"),
    ("04 Rainfall", "python.04_rainfall"),
    ("05 Runoff", "python.05_runoff"),
    ("06 Flood model", "python.06_flood_model"),
    ("07 Publish", "python.07_publish_layers"),
]


def main():
    start = time.time()
    for title, module_name in STEPS:
        print(f"\n[{title}]")
        importlib.import_module(module_name).run()
    print(f"\nPipeline verification complete in {time.time() - start:.1f}s")


if __name__ == "__main__":
    main()
