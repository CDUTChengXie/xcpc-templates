# Kruskal

先 `Kruskal(n)`，每条无向边用 `addEdge(u,v,w)` 加一次，最后 `work()`；通过返回结果的 `connected` 判断是否连通。

无向边每条只加入一次，允许负权、重边和自环；边权和总权用 i64。 点下标 0..n-1；不连通时 connected=false，weight/edges 仍是最小生成森林结果。 n=1 连通，n=0 不连通；输入边号从 0 开始。

O(m log m + m alpha(n)) 时间，O(n + m) 空间。

```cpp
// Kruskal 最小生成树/森林
struct Kruskal {
    // 一条带权无向输入边
    struct Edge {
        int u;
        int v;
        i64 w;
    };

    // 最小生成树/森林结果
    struct Result {
        bool connected;
        i64 weight;
        std::vector<int> edges; // 选中的输入边号，从 0 按加边顺序编号；不连通时为最小生成森林的边
    };

    int n = 0;
    std::vector<Edge> e;

    // 创建未初始化对象；使用前调用 init
    Kruskal() {}
    // 创建 n 个点的空图
    Kruskal(int n) {
        init(n);
    }

    // 重置为 n 个点的空图
    void init(int n) {
        this->n = n;
        e.clear();
    }

    // 加入无向边并返回输入边号
    int addEdge(int u, int v, i64 w) {
        e.push_back({u, v, w});
        return int(e.size()) - 1;
    }

    // 返回最小生成树/森林结果
    Result work() const {
        std::vector<int> f(n), siz(n, 1), ord(e.size());
        std::iota(f.begin(), f.end(), 0);
        std::iota(ord.begin(), ord.end(), 0);
        auto find = [&](int x) {
            while (x != f[x]) {
                f[x] = f[f[x]];
                x = f[x];
            }
            return x;
        };
        std::sort(ord.begin(), ord.end(), [&](int x, int y) { return e[x].w < e[y].w; });
        Result ans{n == 1, 0, {}};
        for (int id : ord) {
            int x = find(e[id].u);
            int y = find(e[id].v);
            if (x == y) {
                continue;
            }
            if (siz[x] < siz[y]) {
                std::swap(x, y);
            }
            f[y] = x;
            siz[x] += siz[y];
            ans.weight += e[id].w;
            ans.edges.push_back(id);
        }
        ans.connected = int(ans.edges.size()) == n - 1;
        return ans;
    }
};
```
