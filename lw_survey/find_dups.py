import pandas as pd
import math

from .extract_json import load_df

def is_empty(value):
    return (type(value) == float and math.isnan(value))

def find_dups():
    df = load_df()

    # FIXME - copy-paste
    columns = [
        column
        for column in df.columns
        if column not in ('timestamp', 'privacy', 'contacts', 'comments2')
    ]

    print('Total columns: {}'.format(len(columns)))
    print('Total rows: {}'.format(df.index.size))


    header = f"{'i':^4} | {'j':^4} | {'timestamp':^19} | {'timestamp':^19} | {'equal':^10} | {'different':^10} | {'empty_both':^10} | {'empty_x':^10} | {'empty_y':^10}"
    print(header)
    print('-' * len(header))

    for i in range(0, df.index.size):
        for j in range(i+1, df.index.size):
            x = df.iloc[i]
            y = df.iloc[j]

            equal = 0
            different = 0
            empty_both = 0
            empty_x = 0
            empty_y = 0

            for column in columns:
                vx = x[column]
                vy = y[column]
                if is_empty(vx):
                    if is_empty(vy):
                        empty_both += 1
                    else:
                        empty_x += 1
                else:
                    if is_empty(vy):
                        empty_y += 1
                    else:
                        if vx == vy:
                            equal += 1
                        else:
                            different += 1

            if different > 10:
                continue
            if equal < 10:
                continue
            print(
                f"{i:^4} | {j:^4} | {x['timestamp']} | {y['timestamp']} | {equal:^10} | {different:^10} | {empty_both:^10} | {empty_x:^10} | {empty_y:^10}",
                flush=True
            )
